import { groq } from "@ai-sdk/groq";
import type { LlmProvider } from "../llm.types";

export function createGroqProvider(): LlmProvider {
  return {
    name: "groq",
    languageModel: (modelId: string) => groq(modelId)
  };
}
