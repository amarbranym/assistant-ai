import {
  APICallError,
  AISDKError,
  LoadAPIKeyError,
  NoSuchModelError,
  stepCountIs,
  streamText,
  type ModelMessage
} from "ai";
import { z } from "zod";

import { AppError } from "../../common/errors/AppError";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import type { LlmProvider, LlmProviderName, LlmResolvedConfig, LlmStreamRequest } from "./llm.types";
import { createGoogleProvider } from "./providers/google.provider";
import { createGroqProvider } from "./providers/groq.provider";
import { createOpenAIProvider } from "./providers/openai.provider";

const DEFAULTS: Omit<LlmResolvedConfig, "tools"> = {
  provider: "openai",
  model: "gpt-4o-mini",
  systemPrompt: "You are a helpful assistant.",
  temperature: 0.7,
  maxOutputTokens: 1024
};

/** Fallback Gemini model when auto-switching from OpenAI → Google. */
const GOOGLE_FALLBACK_MODEL = "gemini-2.5-flash";

/** Fallback Groq model when auto-switching to Groq. */
const GROQ_FALLBACK_MODEL = "llama-3.3-70b-versatile";

/**
 * List of OpenAI model IDs the frontend exposes that don't actually exist
 * (future/placeholder names). Treat as aliases so we still produce a reply
 * instead of spamming NO_SUCH_MODEL / invalid_request_error.
 */
const OPENAI_MODEL_ALIASES: Record<string, string> = {
  "gpt-5.4": "gpt-4o",
  "gpt-5.4-mini": "gpt-4o-mini",
  "gpt-5.4-nano": "gpt-4o-mini",
  "gpt-5.1": "gpt-4o",
  "gpt-5-mini": "gpt-4o-mini",
  "gpt-5-nano": "gpt-4o-mini",
  "gpt-5": "gpt-4o"
};

/**
 * Returns a `{ provider, model }` pair guaranteed to have its API key present.
 * Order of preference:
 *   1. The provider the user configured (if its key is set).
 *   2. Google (if GOOGLE_GENERATIVE_AI_API_KEY is set) — falls back to Gemini.
 *   3. OpenAI (if OPENAI_API_KEY is set).
 *   4. Groq (if GROQ_API_KEY is set).
 *   5. As-configured (will fail with a clear AppError downstream).
 */
function pickAvailableProvider(
  wantedProvider: LlmProviderName,
  wantedModel: string
): { provider: LlmProviderName; model: string } {
  const hasOpenAI = Boolean(env.providers.openaiApiKey);
  const hasGoogle = Boolean(env.providers.googleGenerativeAiApiKey);
  const hasGroq = Boolean(env.providers.groqApiKey);

  const resolvedModel =
    wantedProvider === "openai" && OPENAI_MODEL_ALIASES[wantedModel]
      ? OPENAI_MODEL_ALIASES[wantedModel]
      : wantedModel;

  if (wantedProvider === "openai" && hasOpenAI) {
    return { provider: "openai", model: resolvedModel };
  }
  if (wantedProvider === "google" && hasGoogle) {
    return { provider: "google", model: wantedModel };
  }
  if (wantedProvider === "groq" && hasGroq) {
    return { provider: "groq", model: wantedModel };
  }

  if (hasGoogle) {
    logger.warn(
      { wantedProvider, wantedModel, fallback: `google:${GOOGLE_FALLBACK_MODEL}` },
      "LLM: requested provider key missing, falling back to Google Gemini"
    );
    return { provider: "google", model: GOOGLE_FALLBACK_MODEL };
  }
  if (hasOpenAI) {
    logger.warn(
      { wantedProvider, wantedModel, fallback: `openai:${resolvedModel || DEFAULTS.model}` },
      "LLM: requested provider key missing, falling back to OpenAI"
    );
    return { provider: "openai", model: resolvedModel || DEFAULTS.model };
  }
  if (hasGroq) {
    logger.warn(
      { wantedProvider, wantedModel, fallback: `groq:${GROQ_FALLBACK_MODEL}` },
      "LLM: requested provider key missing, falling back to Groq"
    );
    return { provider: "groq", model: GROQ_FALLBACK_MODEL };
  }
  return { provider: wantedProvider, model: resolvedModel };
}

const assistantConfigSchema = z
  .object({
    model: z
      .object({
        provider: z.enum(["openai", "google", "groq"]).optional(),
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
    google: createGoogleProvider(),
    groq: createGroqProvider()
  };
}

export function resolveLlmConfigFromAssistantConfig(
  assistantConfig: unknown,
  options?: { tools?: LlmResolvedConfig["tools"] }
): LlmResolvedConfig {
  const parsed = assistantConfigSchema.safeParse(assistantConfig);

  const modelCfg = parsed.success ? parsed.data.model : undefined;

  const wantedProvider: LlmProviderName = modelCfg?.provider ?? DEFAULTS.provider;
  const wantedModel = modelCfg?.model ?? DEFAULTS.model;
  const { provider, model } = pickAvailableProvider(wantedProvider, wantedModel);

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

  // Also support legacy/top-level maxTokens (frontend stores `config.maxTokens`).
  const legacyMaxTokens =
    parsed.success && typeof (parsed.data as Record<string, unknown>).maxTokens === "number"
      ? Number((parsed.data as Record<string, unknown>).maxTokens)
      : undefined;

  return {
    provider,
    model,
    systemPrompt,
    temperature,
    maxOutputTokens:
      legacyMaxTokens && Number.isFinite(legacyMaxTokens) && legacyMaxTokens > 0
        ? Math.min(Math.floor(legacyMaxTokens), 32768)
        : maxOutputTokens,
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

  const toolEntries = req.config.tools ? Object.keys(req.config.tools).length : 0;

  try {
    return streamText({
      model,
      messages,
      temperature: req.config.temperature,
      maxOutputTokens: req.config.maxOutputTokens,
      ...(req.config.tools ? { tools: req.config.tools } : {}),
      ...(toolEntries > 0 ? { stopWhen: stepCountIs(12) } : {}),
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

