import { z } from "zod";
import { tool, type Tool } from "ai";

import type { RuntimeToolManifestEntry } from "./assistant-tools.types";

export type PlatformToolId = "getWeather" | "getCurrentTime";

type PlatformToolRegistration = {
  id: PlatformToolId;
  label: string;
  /** Injected into layered system prompt when this tool is enabled. */
  usageSummary: string;
  tool: Tool;
};

const getWeather = tool({
  description: "Get the current weather for a specific location.",
  parameters: z.object({
    location: z
      .string()
      .describe("The city and state, e.g. San Francisco, CA"),
    unit: z.enum(["celsius", "fahrenheit"]).optional().default("fahrenheit")
  }),
  // @ts-expect-error — ai-sdk `tool()` execute overloads vary by version
  execute: async ({ location, unit }) => {
    return `The weather in ${location} is currently 72 degrees ${unit}.`;
  }
});

const getCurrentTime = tool({
  description: "Get the current date and time.",
  parameters: z.object({
    timezone: z
      .string()
      .optional()
      .describe("Optional timezone; otherwise UTC is used.")
  }),
  // @ts-expect-error — ai-sdk `tool()` execute overloads vary by version
  execute: async ({ timezone }) => {
    return new Date().toLocaleString("en-US", { timeZone: timezone || "UTC" });
  }
});

const registrations: Record<PlatformToolId, PlatformToolRegistration> = {
  getWeather: {
    id: "getWeather",
    label: "Weather lookup",
    usageSummary:
      "Use when the user asks for current weather for a specific place. Requires a location.",
    tool: getWeather
  },
  getCurrentTime: {
    id: "getCurrentTime",
    label: "Current date and time",
    usageSummary:
      "Use when the user needs the current time or date, optionally in a timezone.",
    tool: getCurrentTime
  }
};

export const PLATFORM_TOOL_IDS = Object.keys(registrations) as PlatformToolId[];

export function isPlatformToolId(id: string): id is PlatformToolId {
  return id in registrations;
}

export function getPlatformTool(id: PlatformToolId): Tool {
  return registrations[id].tool;
}

export function platformToolManifestEntry(id: PlatformToolId): RuntimeToolManifestEntry {
  const r = registrations[id];
  return {
    kind: "platform",
    id: r.id,
    label: r.label,
    usageSummary: r.usageSummary
  };
}

/** @deprecated Prefer resolveAssistantRuntimeTools — kept for any legacy imports. */
export function getEnabledPlatformTools(toolNames: Iterable<string>): Record<string, Tool> {
  const out: Record<string, Tool> = {};
  for (const name of toolNames) {
    if (isPlatformToolId(name)) {
      out[name] = registrations[name].tool;
    }
  }
  return out;
}
