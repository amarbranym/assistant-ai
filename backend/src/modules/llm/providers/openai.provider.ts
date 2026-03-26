import { openai } from "@ai-sdk/openai";
import type { LlmProvider } from "../llm.types";

export function createOpenAIProvider(): LlmProvider {
  return {
    name: "openai",
    languageModel: (modelId: string) => openai(modelId)
  };
}

