import { z } from "zod";
import { tool } from "ai";

import type { Assistant } from "@prisma/client";
import { AppError } from "../../common/errors/AppError";
import { safeFetch } from "../../common/http/safe-fetch";
import { logger } from "../../config/logger";
import { getPrismaClient } from "../../lib/prismaClient";

const prisma = getPrismaClient();

type CustomApiConfig = {
  url: string;
  method?: "POST" | "GET";
  headers?: Record<string, string>;
  requiredFields?: string[];
};

function readCustomApiConfig(assistant: Assistant): CustomApiConfig | null {
  const cfg = (assistant.config ?? {}) as Record<string, unknown>;
  const tools = cfg.tools && typeof cfg.tools === "object" ? (cfg.tools as Record<string, unknown>) : {};
  const customApi = tools.custom_api;
  if (!customApi || typeof customApi !== "object") return null;
  const c = customApi as Record<string, unknown>;
  const url = typeof c.url === "string" ? c.url.trim() : "";
  if (!url) return null;
  return {
    url,
    method: c.method === "GET" ? "GET" : "POST",
    headers: c.headers && typeof c.headers === "object" ? (c.headers as Record<string, string>) : undefined,
    requiredFields: Array.isArray(c.requiredFields)
      ? c.requiredFields
          .filter((x): x is string => typeof x === "string" && Boolean(x.trim()))
          .map((x) => x.trim())
      : []
  };
}

async function logToolEvent(conversationId: string, event: Record<string, unknown>) {
  await prisma.message.create({
    data: {
      conversationId,
      role: "system",
      content: JSON.stringify({ type: "tool.event", ...event })
    }
  });
}

export function buildCustomApiTool(input: {
  assistant: Assistant;
  conversationId: string;
  mode: "test" | "live";
}) {
  const cfg = readCustomApiConfig(input.assistant);
  if (!cfg) return null;

  const requiredFields = cfg.requiredFields ?? [];

  return tool({
    description:
      "Call the assistant's configured Custom API webhook. Use this only when you have all required fields. If fields are missing, ask the user for ONE missing field at a time.",
    parameters: z.object({
      payload: z.record(z.unknown()).describe("JSON payload to send to the webhook.")
    }),
    // @ts-expect-error ai-sdk execute overload varies
    execute: async ({ payload }) => {
      const missing = requiredFields.filter((k) => payload?.[k] === undefined || payload?.[k] === null || payload?.[k] === "");
      if (missing.length > 0) {
        const msg = `Missing required fields for Custom API: ${missing.join(", ")}. Ask the user for "${missing[0]}".`;
        await logToolEvent(input.conversationId, {
          tool: "custom_api",
          status: "missing_fields",
          missing
        }).catch(() => {});
        return msg;
      }

      await logToolEvent(input.conversationId, {
        tool: "custom_api",
        status: "started",
        mode: input.mode,
        url: cfg.url
      }).catch(() => {});

      if (input.mode !== "live") {
        await logToolEvent(input.conversationId, {
          tool: "custom_api",
          status: "simulated",
          mode: input.mode
        }).catch(() => {});
        return "TEST MODE: Simulated Custom API call (no external request was made).";
      }

      try {
        const res = await safeFetch(cfg.url, {
          method: cfg.method ?? "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cfg.headers ?? {})
          },
          body: cfg.method === "GET" ? undefined : JSON.stringify(payload ?? {})
        });

        await logToolEvent(input.conversationId, {
          tool: "custom_api",
          status: res.ok ? "success" : "failed",
          httpStatus: res.status
        }).catch(() => {});

        if (!res.ok) {
          return `Custom API failed (HTTP ${res.status}).`;
        }
        return res.text || "Custom API succeeded.";
      } catch (err) {
        const code = err instanceof AppError ? err.code : "TOOL_FETCH_FAILED";
        const message = err instanceof Error ? err.message : "Custom API failed";
        await logToolEvent(input.conversationId, {
          tool: "custom_api",
          status: "error",
          errorCode: code,
          message
        }).catch(() => {});
        logger.warn({ err: message, code }, "custom_api tool fetch failed");
        return `Custom API error: ${message}`;
      }
    }
  });
}

