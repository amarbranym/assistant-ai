import {
  APICallError,
  AISDKError,
  LoadAPIKeyError,
  NoSuchModelError,
  streamText,
  type ModelMessage
} from "ai";
import { z } from "zod";

import { AppError } from "../../common/errors/AppError";
import type { LlmProvider, LlmProviderName, LlmResolvedConfig, LlmStreamRequest } from "./llm.types";
import { createGoogleProvider } from "./providers/google.provider";
import { createOpenAIProvider } from "./providers/openai.provider";

const DEFAULTS: Omit<LlmResolvedConfig, "tools"> = {
  provider: "openai",
  model: "gpt-4o-mini",
  systemPrompt: "You are a helpful assistant.",
  temperature: 0.7,
  maxOutputTokens: 1024
};

const assistantConfigSchema = z
  .object({
    model: z
      .object({
        provider: z.enum(["openai", "google"]).optional(),
        model: z.string().min(1).optional(),
        systemPrompt: z.string().min(1).optional(),
        temperature: z.number().min(0).max(2).optional(),
        maxOutputTokens: z.number().int().min(1).max(32768).optional()
      })
      .passthrough()
      .optional(),
    systemPrompt: z.string().min(1).optional()
  })
  .passthrough();

function extractSystemPromptFromModelMessages(messages: unknown): string | undefined {
  if (!Array.isArray(messages)) return undefined;
  for (const m of messages) {
    if (!m || typeof m !== "object") continue;
    const r = m as Record<string, unknown>;
    if (r.role !== "system") continue;
    const content = r.content;
    if (typeof content === "string" && content.trim()) return content.trim();
  }
  return undefined;
}

function getProviderRegistry(): Record<LlmProviderName, LlmProvider> {
  return {
    openai: createOpenAIProvider(),
    google: createGoogleProvider()
  };
}

export function resolveLlmConfigFromAssistantConfig(
  assistantConfig: unknown,
  options?: { tools?: LlmResolvedConfig["tools"] }
): LlmResolvedConfig {
  const parsed = assistantConfigSchema.safeParse(assistantConfig);

  const modelCfg = parsed.success ? parsed.data.model : undefined;

  const provider = modelCfg?.provider ?? DEFAULTS.provider;
  const model = modelCfg?.model ?? DEFAULTS.model;

  const systemPromptFromMessages = extractSystemPromptFromModelMessages(
    modelCfg && typeof modelCfg === "object" ? (modelCfg as Record<string, unknown>).messages : undefined
  );

  const systemPrompt =
    systemPromptFromMessages ??
    modelCfg?.systemPrompt ??
    (parsed.success ? parsed.data.systemPrompt : undefined) ??
    DEFAULTS.systemPrompt;

  const temperature = modelCfg?.temperature ?? DEFAULTS.temperature;
  const maxOutputTokens =
    modelCfg?.maxOutputTokens ?? DEFAULTS.maxOutputTokens;

  return {
    provider,
    model,
    systemPrompt,
    temperature,
    maxOutputTokens,
    ...(options?.tools ? { tools: options.tools } : {})
  };
}

export function normalizeMessages(input: {
  systemPrompt: string;
  messages: ModelMessage[];
}): ModelMessage[] {
  const { systemPrompt } = input;
  const messages = input.messages.filter(
    (m): m is ModelMessage =>
      m != null &&
      typeof m === "object" &&
      "role" in m &&
      typeof (m as { role?: unknown }).role === "string"
  );

  const hasSystem = messages.some((m) => m.role === "system");
  if (hasSystem) return messages;

  return [{ role: "system", content: systemPrompt }, ...messages];
}

function mapProviderError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof LoadAPIKeyError) {
    return new AppError(
      500,
      "LLM provider API key is missing. Configure provider credentials in backend/.env and restart the server.",
      "LLM_API_KEY_MISSING"
    );
  }

  if (err instanceof NoSuchModelError) {
    return new AppError(
      400,
      `Unsupported or unknown model: ${err.message}`,
      "LLM_UNSUPPORTED_MODEL"
    );
  }

  if (err instanceof APICallError) {
    const status = typeof err.statusCode === "number" ? err.statusCode : 502;
    const message =
      status >= 500
        ? "LLM provider is temporarily unavailable."
        : err.message || "LLM provider request failed.";
    return new AppError(status, message, "LLM_API_ERROR");
  }

  if (err instanceof AISDKError) {
    return new AppError(502, err.message || "LLM error", "LLM_ERROR");
  }

  const message = err instanceof Error ? err.message : "Unknown LLM error";
  return new AppError(500, message, "LLM_INTERNAL_ERROR");
}

export function getProvider(name: LlmProviderName): LlmProvider {
  const registry = getProviderRegistry();
  const provider = registry[name];
  if (!provider) {
    throw new AppError(400, `Unsupported provider: ${name}`, "LLM_UNSUPPORTED_PROVIDER");
  }
  return provider;
}

export function streamTextResponse(req: LlmStreamRequest) {
  const provider = getProvider(req.config.provider);
  const model = provider.languageModel(req.config.model);

  const messages = normalizeMessages({
    systemPrompt: req.config.systemPrompt,
    messages: req.messages
  });

  try {
    return streamText({
      model,
      messages,
      temperature: req.config.temperature,
      maxOutputTokens: req.config.maxOutputTokens,
      ...(req.config.tools ? { tools: req.config.tools } : {}),
      ...(req.abortSignal ? { abortSignal: req.abortSignal } : {}),
      ...(req.onFinish
        ? {
            onFinish: async ({ text }) => {
              await req.onFinish?.({ text });
            }
          }
        : {})
    });
  } catch (err) {
    throw mapProviderError(err);
  }
}

export async function streamTextResponseSafe(req: LlmStreamRequest) {
  try {
    return streamTextResponse(req);
  } catch (err) {
    throw mapProviderError(err);
  }
}

