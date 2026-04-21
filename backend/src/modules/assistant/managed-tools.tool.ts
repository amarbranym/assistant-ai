import { tool, type Tool } from "ai";
import { z } from "zod";
import type { Assistant } from "@prisma/client";

import { AppError } from "../../common/errors/AppError";
import type { RuntimeToolManifestEntry } from "./tooling/assistant-tools.types";
import { safeFetch } from "../../common/http/safe-fetch";
import { logger } from "../../config/logger";
import { getPrismaClient } from "../../lib/prismaClient";

const prisma = getPrismaClient();

type ManagedToolParam = {
  key: string;
  value: string;
  required: boolean;
};

type ManagedToolConfig = {
  toolId: string;
  name: string;
  enabled: boolean;
  endpointUrl: string;
  authType: "none" | "api_key" | "bearer";
  authValue: string;
  params: ManagedToolParam[];
  headers: ManagedToolParam[];
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function normalizeManagedParams(input: unknown): ManagedToolParam[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((x) => asRecord(x))
    .filter((x): x is Record<string, unknown> => Boolean(x))
    .map((x) => ({
      key: typeof x.key === "string" ? x.key.trim() : "",
      value: typeof x.value === "string" ? x.value : "",
      required: typeof x.required === "boolean" ? x.required : false
    }))
    .filter((x) => Boolean(x.key));
}

function readManagedToolConfigs(assistant: Assistant): ManagedToolConfig[] {
  const config = asRecord(assistant.config) ?? {};
  const integrations = asRecord(config.integrations) ?? {};
  const raw = Array.isArray(integrations.toolConfigs) ? integrations.toolConfigs : [];
  return raw
    .map((x) => asRecord(x))
    .filter((x): x is Record<string, unknown> => Boolean(x))
    .map((x) => {
      const authType: "none" | "api_key" | "bearer" =
        x.authType === "api_key" || x.authType === "bearer" ? x.authType : "none";
      return {
        toolId: typeof x.toolId === "string" ? x.toolId : "",
        name: typeof x.name === "string" ? x.name : "tool",
        enabled: typeof x.enabled === "boolean" ? x.enabled : true,
        endpointUrl: typeof x.endpointUrl === "string" ? x.endpointUrl.trim() : "",
        authType,
        authValue: typeof x.authValue === "string" ? x.authValue : "",
        params: normalizeManagedParams(x.params),
        headers: normalizeManagedParams(x.headers)
      };
    })
    .filter((x) => x.enabled && Boolean(x.toolId) && Boolean(x.endpointUrl));
}

function toToolKey(input: { toolId: string; name: string }, used: Set<string>): string {
  const raw = `${input.name || "tool"}_${input.toolId}`.toLowerCase();
  const normalized = raw.replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").slice(0, 48);
  let candidate = `managed_${normalized || "tool"}`;
  let i = 1;
  while (used.has(candidate)) {
    i += 1;
    candidate = `${candidate}_${i}`;
  }
  used.add(candidate);
  return candidate;
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

function headersFromConfig(config: ManagedToolConfig): Record<string, string> {
  const base = config.headers.reduce<Record<string, string>>((acc, h) => {
    if (!h.key) return acc;
    acc[h.key] = h.value;
    return acc;
  }, {});
  if (config.authType === "api_key" && config.authValue.trim()) {
    base["x-api-key"] = config.authValue.trim();
  } else if (config.authType === "bearer" && config.authValue.trim()) {
    base.Authorization = `Bearer ${config.authValue.trim()}`;
  }
  return base;
}

type ManagedBuildResult = {
  tools: Record<string, Tool>;
  manifest: RuntimeToolManifestEntry[];
};

function buildManagedIntegrationToolsInternal(input: {
  assistant: Assistant;
  conversationId: string;
  mode: "test" | "live";
}): ManagedBuildResult {
  const configs = readManagedToolConfigs(input.assistant);
  if (configs.length === 0) return { tools: {}, manifest: [] };
  const out: Record<string, Tool> = {};
  const manifest: RuntimeToolManifestEntry[] = [];
  const used = new Set<string>();

  for (const cfg of configs) {
    const toolKey = toToolKey({ toolId: cfg.toolId, name: cfg.name }, used);
    const requiredFields = cfg.params.filter((p) => p.required).map((p) => p.key);
    const staticPayload = cfg.params
      .filter((p) => !p.required && p.value.trim())
      .reduce<Record<string, unknown>>((acc, p) => {
        acc[p.key] = p.value;
        return acc;
      }, {});

    manifest.push({
      kind: "managed",
      id: toolKey,
      label: cfg.name,
      usageSummary:
        `Integration “${cfg.name}”. Use when the user’s request matches this workflow. ` +
        "Ask for one missing required field at a time; never invent field values."
    });

    out[toolKey] = tool({
      description: `Execute "${cfg.name}" integration. Ask for one missing required field at a time before execution.`,
      parameters: z.object({
        payload: z.record(z.unknown()).optional().describe("Payload values collected from conversation.")
      }),
      // @ts-expect-error ai-sdk execute overload varies
      execute: async ({ payload }) => {
        const mergedPayload = { ...staticPayload, ...((payload ?? {}) as Record<string, unknown>) };
        const missing = requiredFields.filter((key) => {
          const v = mergedPayload[key];
          return v === undefined || v === null || v === "";
        });

        if (missing.length > 0) {
          await logToolEvent(input.conversationId, {
            tool: "managed_integration",
            toolId: cfg.toolId,
            toolName: cfg.name,
            toolKey,
            status: "missing_fields",
            missing
          }).catch(() => {});
          return `Missing required fields for ${cfg.name}: ${missing.join(", ")}. Ask for "${missing[0]}".`;
        }

        await logToolEvent(input.conversationId, {
          tool: "managed_integration",
          toolId: cfg.toolId,
          toolName: cfg.name,
          toolKey,
          status: "started",
          mode: input.mode,
          url: cfg.endpointUrl
        }).catch(() => {});

        if (input.mode !== "live") {
          await logToolEvent(input.conversationId, {
            tool: "managed_integration",
            toolId: cfg.toolId,
            toolName: cfg.name,
            toolKey,
            status: "simulated",
            mode: input.mode
          }).catch(() => {});
          return `TEST MODE: Simulated ${cfg.name} call (no external request made).`;
        }

        try {
          const res = await safeFetch(cfg.endpointUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...headersFromConfig(cfg)
            },
            body: JSON.stringify(mergedPayload)
          });

          await logToolEvent(input.conversationId, {
            tool: "managed_integration",
            toolId: cfg.toolId,
            toolName: cfg.name,
            toolKey,
            status: res.ok ? "success" : "failed",
            httpStatus: res.status
          }).catch(() => {});

          if (!res.ok) {
            return `${cfg.name} failed (HTTP ${res.status}).`;
          }
          return res.text || `${cfg.name} succeeded.`;
        } catch (err) {
          const code = err instanceof AppError ? err.code : "TOOL_FETCH_FAILED";
          const message = err instanceof Error ? err.message : `${cfg.name} failed`;
          await logToolEvent(input.conversationId, {
            tool: "managed_integration",
            toolId: cfg.toolId,
            toolName: cfg.name,
            toolKey,
            status: "error",
            errorCode: code,
            message
          }).catch(() => {});
          logger.warn({ err: message, code, toolKey }, "managed integration fetch failed");
          return `${cfg.name} error: ${message}`;
        }
      }
    });
  }

  return { tools: out, manifest };
}

export function buildManagedIntegrationTools(input: {
  assistant: Assistant;
  conversationId: string;
  mode: "test" | "live";
}): Record<string, Tool> {
  return buildManagedIntegrationToolsInternal(input).tools;
}

export function buildManagedIntegrationToolsWithManifest(input: {
  assistant: Assistant;
  conversationId: string;
  mode: "test" | "live";
}): ManagedBuildResult {
  return buildManagedIntegrationToolsInternal(input);
}
