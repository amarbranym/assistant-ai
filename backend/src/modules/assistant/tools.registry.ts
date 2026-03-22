import { z } from "zod";
import { tool } from "ai";

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

export const predefinedTools = {
  getWeather,
  getCurrentTime
};

export type AvailableTools = keyof typeof predefinedTools;

export function getEnabledTools(toolNames: string[]) {
  const toolsToProvide: Record<string, (typeof predefinedTools)[AvailableTools]> =
    {};

  for (const tName of toolNames) {
    if (tName in predefinedTools) {
      toolsToProvide[tName] = predefinedTools[tName as AvailableTools];
    }
  }

  return toolsToProvide;
}
