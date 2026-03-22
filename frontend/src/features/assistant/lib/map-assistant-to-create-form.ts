import {
  FIRST_MESSAGE_MODES,
  MODEL_PROVIDERS,
  STREAMING_LATENCY_MODES,
  TOOL_IDS,
  VOICE_PROVIDERS,
  type CreateAssistantFormValues,
  defaultCreateAssistantFormValues,
  type FirstMessageMode,
  type StreamingLatencyMode,
} from "../schemas/create-assistant-form.schema";
import type { AssistantRecord } from "../types/api-assistant";

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function asModelProvider(
  v: string
): CreateAssistantFormValues["modelProvider"] {
  return (MODEL_PROVIDERS as readonly string[]).includes(v)
    ? (v as CreateAssistantFormValues["modelProvider"])
    : defaultCreateAssistantFormValues.modelProvider;
}

function asVoiceProvider(v: string): CreateAssistantFormValues["voiceProvider"] {
  const normalized = v === "11labs" ? "elevenlabs" : v;
  return (VOICE_PROVIDERS as readonly string[]).includes(normalized)
    ? (normalized as CreateAssistantFormValues["voiceProvider"])
    : defaultCreateAssistantFormValues.voiceProvider;
}

function asFirstMessageMode(v: string): FirstMessageMode {
  return (FIRST_MESSAGE_MODES as readonly string[]).includes(v)
    ? (v as FirstMessageMode)
    : defaultCreateAssistantFormValues.firstMessageMode;
}

function asStreamingLatency(v: string): StreamingLatencyMode {
  return (STREAMING_LATENCY_MODES as readonly string[]).includes(v)
    ? (v as StreamingLatencyMode)
    : defaultCreateAssistantFormValues.optimizeStreamingLatency;
}

/**
 * Builds form values from a stored assistant row and its `config` JSON.
 * Unknown or legacy shapes fall back to {@link defaultCreateAssistantFormValues}.
 */
export function mapAssistantRecordToFormValues(
  record: AssistantRecord
): CreateAssistantFormValues {
  const base: CreateAssistantFormValues = structuredClone(
    defaultCreateAssistantFormValues
  );

  base.name = record.name;
  base.description = record.description ?? "";
  base.active = record.active;

  const c = isRecord(record.config) ? record.config : {};

  const model = isRecord(c.model) ? c.model : null;
  if (model) {
    if (typeof model.provider === "string")
      base.modelProvider = asModelProvider(model.provider);
    if (typeof model.model === "string" && model.model.length > 0)
      base.modelId = model.model;
  }

  if (typeof c.firstMessageMode === "string")
    base.firstMessageMode = asFirstMessageMode(c.firstMessageMode);
  if (typeof c.firstMessage === "string") base.firstMessage = c.firstMessage;
  if (typeof c.systemPrompt === "string") base.systemPrompt = c.systemPrompt;
  if (typeof c.maxTokens === "number" && Number.isFinite(c.maxTokens))
    base.maxTokens = c.maxTokens;
  if (typeof c.temperature === "number" && Number.isFinite(c.temperature))
    base.temperature = c.temperature;

  const voice = isRecord(c.voice) ? c.voice : null;
  if (voice) {
    if (typeof voice.provider === "string")
      base.voiceProvider = asVoiceProvider(voice.provider);
    if (typeof voice.model === "string" && voice.model.length > 0)
      base.voiceModel = voice.model;
    if (typeof voice.voiceCatalogId === "string")
      base.voiceCatalogId = voice.voiceCatalogId;
    if (typeof voice.voiceManualId === "string")
      base.voiceManualId = voice.voiceManualId;
    if (typeof voice.useVoiceIdManually === "boolean")
      base.useVoiceIdManually = voice.useVoiceIdManually;
    if (typeof voice.voiceId === "string" && voice.voiceId.length > 0) {
      base.useVoiceIdManually = true;
      base.voiceManualId = voice.voiceId;
    }
    if (typeof voice.stability === "number" && Number.isFinite(voice.stability))
      base.voiceStability = voice.stability;
    if (
      typeof voice.similarity === "number" &&
      Number.isFinite(voice.similarity)
    )
      base.voiceSimilarity = voice.similarity;
    if (typeof voice.speed === "number" && Number.isFinite(voice.speed))
      base.voiceSpeed = voice.speed;
    if (
      typeof voice.styleExaggeration === "number" &&
      Number.isFinite(voice.styleExaggeration)
    )
      base.voiceStyleExaggeration = voice.styleExaggeration;
    if (typeof voice.backgroundSound === "string")
      base.backgroundSound = voice.backgroundSound;
    if (typeof voice.backgroundSoundUrl === "string")
      base.backgroundSoundUrl = voice.backgroundSoundUrl;
    if (
      typeof voice.inputMinCharacters === "number" &&
      Number.isFinite(voice.inputMinCharacters)
    )
      base.inputMinCharacters = voice.inputMinCharacters;
    if (typeof voice.punctuationBoundaries === "string")
      base.punctuationBoundaries = voice.punctuationBoundaries;
    if (typeof voice.optimizeStreamingLatency === "string")
      base.optimizeStreamingLatency = asStreamingLatency(
        voice.optimizeStreamingLatency
      );
    if (typeof voice.useSpeakerBoost === "boolean")
      base.useSpeakerBoost = voice.useSpeakerBoost;
    if (typeof voice.voiceAutoMode === "boolean")
      base.voiceAutoMode = voice.voiceAutoMode;
  }

  const tools = isRecord(c.tools) ? c.tools : null;
  if (tools) {
    for (const id of TOOL_IDS) {
      if (typeof tools[id] === "boolean") {
        base.tools[id] = tools[id] as boolean;
      }
    }
  }

  const advanced = c.advanced;
  if (Array.isArray(advanced)) {
    base.advancedEntries = advanced
      .filter(isRecord)
      .map((e) => ({
        key: typeof e.key === "string" ? e.key : "",
        value: typeof e.value === "string" ? e.value : "",
      }));
  }

  return base;
}
