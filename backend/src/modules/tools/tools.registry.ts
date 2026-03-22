import { z } from "zod";
import { tool } from "ai";

// Mock weather tool
const getWeather = tool({
  description: "Get the current weather for a specific location.",
  parameters: z.object({
    location: z.string().describe("The city and state, e.g., San Francisco, CA"),
    unit: z.enum(["celsius", "fahrenheit"]).optional().default("fahrenheit")
  }),
  // @ts-ignore
  execute: async ({ location, unit }) => {
    // Mock implementation for weather
    return `The weather in ${location} is currently 72 degrees ${unit}.`;
  }
});

// Real time tool
const getCurrentTime = tool({
  description: "Get the current date and time.",
  parameters: z.object({
    timezone: z.string().optional().describe("Optional timezone, otherwise UTC is used.")
  }),
  // @ts-ignore
  execute: async ({ timezone }) => {
    return new Date().toLocaleString("en-US", { timeZone: timezone || "UTC" });
  }
});

// A map of available predefined tools
export const predefinedTools = {
  getWeather,
  getCurrentTime
};

export type AvailableTools = keyof typeof predefinedTools;

/**
 * Given a list of tool names (strings), returns the actual tool objects
 * configured for the Vercel AI SDK.
 */
export function getEnabledTools(toolNames: string[]) {
  const toolsToProvide: Record<string, any> = {};
  
  for (const tName of toolNames) {
    if (tName in predefinedTools) {
      toolsToProvide[tName] = predefinedTools[tName as AvailableTools];
    }
  }

  return toolsToProvide;
}
