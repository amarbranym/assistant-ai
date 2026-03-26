import { google } from "@ai-sdk/google";
import type { LlmProvider } from "../llm.types";

export function createGoogleProvider(): LlmProvider {
  return {
    name: "google",
    languageModel: (modelId: string) => google(modelId)
  };
}

