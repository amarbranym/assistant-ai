import type { LanguageModel, ModelMessage, Tool } from "ai";

export type LlmProviderName = "openai" | "google";

export type LlmResolvedConfig = {
  provider: LlmProviderName;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxOutputTokens: number;
  tools?: Record<string, Tool>;
};

export type LlmStreamRequest = {
  config: LlmResolvedConfig;
  messages: ModelMessage[];
  abortSignal?: AbortSignal;
  onFinish?: (args: { text: string }) => void | Promise<void>;
};

export type LlmProvider = {
  readonly name: LlmProviderName;
  languageModel(modelId: string): LanguageModel;
};

