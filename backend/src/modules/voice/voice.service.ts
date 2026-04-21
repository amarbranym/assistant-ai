import { randomUUID } from "crypto";
import type { Assistant } from "@prisma/client";
import type { Tool } from "ai";

import { AppError } from "../../common/errors/AppError";
import { env } from "../../config/env";
import { getPrismaClient } from "../../lib/prismaClient";
import { streamAssistantReply } from "../channels/chat/chat.service";
import { resolveTTSProvider, type TTSProvider } from "./providers/tts.provider";
import type { VoiceResolvedConfig, VoiceSessionState } from "./voice.types";

/**
 * Verify all provider credentials this session will need are present BEFORE we
 * accept client audio. Without this, a session silently appears "stuck in
 * Listening" because Deepgram never connects or the LLM returns HTTP 401.
 *
 * Throws an `AppError` with a clear code/message that the voice websocket
 * surfaces as an `error` event to the client.
 */
export function assertVoiceProviderKeys(voiceConfig: VoiceResolvedConfig, assistant: Assistant): void {
  const missing: string[] = [];

  if (voiceConfig.sttProvider === "deepgram" && !env.providers.deepgramApiKey) {
    missing.push("DEEPGRAM_API_KEY (speech-to-text)");
  }
  if (voiceConfig.ttsProvider === "elevenlabs" && !env.providers.elevenlabsApiKey) {
    missing.push("ELEVENLABS_API_KEY (text-to-speech)");
  }

  // LLM selection happens inside chat.service based on the assistant's model.
  // We can't always tell ahead of time which provider will be used, so we
  // require AT LEAST ONE of the common LLM keys to be present.
  const hasAnyLlmKey =
    Boolean(env.providers.openaiApiKey) ||
    Boolean(env.providers.googleGenerativeAiApiKey) ||
    Boolean(env.providers.groqApiKey);
  if (!hasAnyLlmKey) {
    missing.push("OPENAI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY)");
  }

  if (missing.length > 0) {
    throw new AppError(
      500,
      `Voice session cannot start: missing provider credentials → ${missing.join(", ")}. Add them to backend/.env (see backend/.env.example) and restart the backend. Assistant: ${assistant.name}.`,
      "VOICE_PROVIDERS_MISCONFIGURED"
    );
  }
}

const prisma = getPrismaClient();
const ELEVENLABS_DEFAULT_MODEL = "eleven_turbo_v2_5";
const ELEVENLABS_DEFAULT_VOICE_ID = "RXe6OFmxoC0nlSWpuCDy";
const ELEVENLABS_ALLOWED_MODEL_PREFIXES = ["eleven_", "eleven_multilingual", "flash_"];

export async function getAssistantForVoiceSession(input: {
  assistantId: string;
  userId: string;
}): Promise<Assistant> {
  const assistant = await prisma.assistant.findFirst({
    where: { id: input.assistantId, userId: input.userId }
  });
  if (!assistant) {
    throw new AppError(404, "Assistant not found", "NOT_FOUND");
  }
  if (!assistant.active) {
    throw new AppError(403, "Assistant is inactive. Activate it before voice talk.", "ASSISTANT_INACTIVE");
  }
  return assistant;
}

export async function getOrCreateConversationForVoice(input: {
  assistantId: string;
  conversationId?: string;
}) {
  if (input.conversationId) {
    const existing = await prisma.conversation.findFirst({
      where: { id: input.conversationId, assistantId: input.assistantId }
    });
    if (existing) return existing;
    throw new AppError(404, "Conversation not found", "CONVERSATION_NOT_FOUND");
  }
  return prisma.conversation.create({ data: { assistantId: input.assistantId } });
}

export function resolveVoiceConfig(assistant: Assistant): VoiceResolvedConfig {
  const config = (assistant.config ?? {}) as Record<string, unknown>;
  const voice = (config.voice ?? {}) as Record<string, unknown>;

  const punctuationBoundaries =
    typeof voice.punctuationBoundaries === "string"
      ? voice.punctuationBoundaries
          .split("")
          .map((x) => x.trim())
          .filter(Boolean)
      : [".", "!", "?"];

  const ttsProvider =
    typeof voice.provider === "string" && voice.provider.trim()
      ? voice.provider.trim().toLowerCase()
      : "elevenlabs";
  const sttProvider =
    typeof voice.sttProvider === "string" && voice.sttProvider.trim()
      ? voice.sttProvider.trim().toLowerCase()
      : "deepgram";

  const configuredModel =
    typeof voice.model === "string" && voice.model.trim() ? voice.model.trim() : "";
  const model = ELEVENLABS_ALLOWED_MODEL_PREFIXES.some((prefix) =>
    configuredModel.startsWith(prefix)
  )
    ? configuredModel
    : ELEVENLABS_DEFAULT_MODEL;

  const configuredVoiceId =
    typeof voice.voiceManualId === "string" && voice.voiceManualId.trim()
      ? voice.voiceManualId.trim()
      : typeof voice.voiceCatalogId === "string" && voice.voiceCatalogId.trim()
        ? voice.voiceCatalogId.trim()
        : undefined;
  const voiceId =
    configuredVoiceId && configuredVoiceId !== "voice_rachel"
      ? configuredVoiceId
      : ELEVENLABS_DEFAULT_VOICE_ID;

  const inputMinCharacters =
    typeof voice.inputMinCharacters === "number" && Number.isFinite(voice.inputMinCharacters)
      ? Math.max(0, Math.floor(voice.inputMinCharacters))
      : 0;

  const num = (v: unknown, fallback: number): number =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;

  const vadEnergyThreshold = Math.min(
    0.2,
    Math.max(0.004, num(voice.vadEnergyThreshold, 0.014))
  );
  const vadSilenceMs = Math.min(3000, Math.max(200, Math.floor(num(voice.vadSilenceMs, 650))));

  const deepgramLanguage =
    typeof voice.deepgramLanguage === "string" && voice.deepgramLanguage.trim()
      ? voice.deepgramLanguage.trim()
      : process.env.DEEPGRAM_LANGUAGE?.trim() || "multi";

  const deepgramEndpointingMs = Math.min(
    5000,
    Math.max(100, Math.floor(num(voice.deepgramEndpointingMs, 400)))
  );

  let deepgramUtteranceEndMs: number | null = 1200;
  if (voice.deepgramUtteranceEndMs === false || voice.deepgramUtteranceEndMs === 0) {
    deepgramUtteranceEndMs = null;
  } else if (typeof voice.deepgramUtteranceEndMs === "number" && Number.isFinite(voice.deepgramUtteranceEndMs)) {
    const u = Math.floor(voice.deepgramUtteranceEndMs);
    deepgramUtteranceEndMs = u < 1000 ? null : Math.min(5000, u);
  }

  const deepgramVadEvents = voice.deepgramVadEvents !== false;

  const latencyMode =
    typeof voice.optimizeStreamingLatency === "string"
      ? voice.optimizeStreamingLatency.trim().toLowerCase()
      : "balanced";
  const elevenlabsStreamingLatency =
    latencyMode === "off" ? 0 : latencyMode === "aggressive" ? 4 : 2;

  const voiceStability = Math.min(1, Math.max(0, num(voice.stability, 0.5)));
  const voiceSimilarityBoost = Math.min(1, Math.max(0, num(voice.similarity, 0.75)));
  const voiceSpeed = Math.min(2, Math.max(0.5, num(voice.speed, 1)));
  const useSpeakerBoost = voice.useSpeakerBoost !== false;

  return {
    ttsProvider,
    sttProvider,
    model,
    voiceId,
    inputMinCharacters,
    punctuationBoundaries,
    vadEnergyThreshold,
    vadSilenceMs,
    deepgramLanguage,
    deepgramEndpointingMs,
    deepgramUtteranceEndMs,
    deepgramVadEvents,
    elevenlabsStreamingLatency,
    voiceStability,
    voiceSimilarityBoost,
    voiceSpeed,
    useSpeakerBoost
  };
}

export function createVoiceSessionState(input: {
  userId: string;
  assistant: Assistant;
  conversationId: string;
  sampleRate?: number;
  mode?: "test" | "live";
}): VoiceSessionState {
  return {
    sessionId: randomUUID(),
    userId: input.userId,
    assistant: input.assistant,
    conversationId: input.conversationId,
    sampleRate: input.sampleRate && Number.isFinite(input.sampleRate) ? input.sampleRate : 16000,
    mode: input.mode ?? "test",
    assistantSpeaking: false,
    assistantSpeechStartedAt: null,
    llmAbortController: null,
    ttsAbortController: null,
    closed: false
  };
}

export function interruptAssistantPlayback(
  session: VoiceSessionState,
  reason: string
): { interrupted: boolean; reason: string } {
  const hadActive = Boolean(session.llmAbortController || session.ttsAbortController);
  session.llmAbortController?.abort();
  session.ttsAbortController?.abort();
  session.llmAbortController = null;
  session.ttsAbortController = null;
  session.assistantSpeaking = false;
  session.assistantSpeechStartedAt = null;
  return { interrupted: hadActive, reason };
}

export async function runAssistantVoiceTurn(input: {
  session: VoiceSessionState;
  userText: string;
  voiceConfig: VoiceResolvedConfig;
  ttsProvider?: TTSProvider;
  tools?: Record<string, Tool>;
  onTextDelta: (text: string) => void;
  onTurnStarted: () => void;
  onTurnCompleted: (finalText: string) => void;
  onAudioChunk: (chunk: Buffer, mimeType: string) => Promise<void> | void;
}): Promise<void> {
  if (!input.userText.trim()) return;

  // Cancel any prior generation/playback before starting a fresh turn.
  interruptAssistantPlayback(input.session, "new-turn");

  input.session.assistantSpeaking = false;
  input.session.assistantSpeechStartedAt = null;
  input.onTurnStarted();

  const llmAbort = new AbortController();
  input.session.llmAbortController = llmAbort;

  const turn = await streamAssistantReply({
    assistant: input.session.assistant,
    conversationId: input.session.conversationId,
    userText: input.userText,
    abortSignal: llmAbort.signal,
    tools: input.tools,
    mode: input.session.mode
  });

  let finalText = "";
  try {
    for await (const delta of turn.result.textStream) {
      if (llmAbort.signal.aborted) break;
      finalText += delta;
      input.onTextDelta(delta);
    }
  } finally {
    input.session.llmAbortController = null;
  }

  if (llmAbort.signal.aborted) {
    input.session.assistantSpeaking = false;
    return;
  }

  if (!finalText.trim()) {
    input.session.assistantSpeaking = false;
    throw new AppError(
      502,
      "Assistant produced no reply text. Check OPENAI_API_KEY / Google AI credentials and the assistant model in settings.",
      "LLM_EMPTY_RESPONSE"
    );
  }

  const ttsAbort = new AbortController();
  const ttsProvider = input.ttsProvider ?? resolveTTSProvider(input.voiceConfig.ttsProvider);
  input.session.ttsAbortController = ttsAbort;
  input.session.assistantSpeaking = true;
  input.session.assistantSpeechStartedAt = Date.now();

  try {
    await ttsProvider.streamSpeech({
      text: finalText,
      voiceId: input.voiceConfig.voiceId || ELEVENLABS_DEFAULT_VOICE_ID,
      modelId: input.voiceConfig.model,
      abortSignal: ttsAbort.signal,
      optimizeStreamingLatency: input.voiceConfig.elevenlabsStreamingLatency,
      voiceStability: input.voiceConfig.voiceStability,
      voiceSimilarityBoost: input.voiceConfig.voiceSimilarityBoost,
      voiceSpeed: input.voiceConfig.voiceSpeed,
      useSpeakerBoost: input.voiceConfig.useSpeakerBoost,
      onChunk: input.onAudioChunk
    });
    input.onTurnCompleted(finalText);
  } finally {
    input.session.ttsAbortController = null;
    input.session.assistantSpeaking = false;
    input.session.assistantSpeechStartedAt = null;
  }
}

