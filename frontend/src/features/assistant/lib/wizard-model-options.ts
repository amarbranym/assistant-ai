import type { SearchableComboboxOption } from "@/components/ui/searchable-combobox";

import {
  MODEL_PROVIDERS,
  VOICE_PROVIDERS,
  type StreamingLatencyMode,
} from "../schemas/create-assistant-form.schema";

const modelProviderLabels: Record<(typeof MODEL_PROVIDERS)[number], string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  azure: "Azure",
  other: "Other",
};

const voiceProviderLabels: Record<(typeof VOICE_PROVIDERS)[number], string> = {
  elevenlabs: "ElevenLabs",
  openai: "OpenAI",
  azure: "Azure",
  google: "Google",
  other: "Other",
};

/** Combobox options for LLM provider. */
export const MODEL_PROVIDER_COMBO_OPTIONS: SearchableComboboxOption[] =
  MODEL_PROVIDERS.map((p) => ({
    value: p,
    label: modelProviderLabels[p],
  }));

/** Combobox options for LLM model id. */
export const MODEL_ID_COMBO_OPTIONS: SearchableComboboxOption[] = [
  { value: "gpt-4.1", label: "GPT-4.1" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "o3-mini", label: "o3-mini" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

/** Combobox options for voice provider. */
export const VOICE_PROVIDER_COMBO_OPTIONS: SearchableComboboxOption[] =
  VOICE_PROVIDERS.map((p) => ({
    value: p,
    label: voiceProviderLabels[p],
  }));

/** Combobox options for voice model. */
export const VOICE_MODEL_COMBO_OPTIONS: SearchableComboboxOption[] = [
  { value: "eleven_turbo_v2_5", label: "Eleven Turbo v2.5" },
  { value: "eleven_multilingual_v2", label: "Eleven Multilingual v2" },
  { value: "tts-1", label: "OpenAI TTS-1" },
  { value: "tts-1-hd", label: "OpenAI TTS-1 HD" },
  { value: "azure-neural", label: "Azure Neural" },
];

/** Mock catalog voices (searchable combobox). */
export const VOICE_CATALOG_COMBO_OPTIONS: SearchableComboboxOption[] = [
  { value: "voice_rachel", label: "Rachel — calm, narrative" },
  { value: "voice_domi", label: "Domi — confident" },
  { value: "voice_bella", label: "Bella — soft" },
  { value: "voice_antoni", label: "Antoni — well-rounded" },
  { value: "voice_elli", label: "Elli — emotional" },
  { value: "voice_josh", label: "Josh — deep" },
];

/** Mock background sound presets. */
export const BACKGROUND_SOUND_COMBO_OPTIONS: SearchableComboboxOption[] = [
  { value: "none", label: "None" },
  { value: "office", label: "Office ambience" },
  { value: "cafe", label: "Café" },
  { value: "nature", label: "Soft nature" },
  { value: "custom", label: "Custom (use URL below)" },
];

/** Labels for streaming latency mode (select). */
export const STREAMING_LATENCY_OPTIONS: {
  value: StreamingLatencyMode;
  label: string;
  hint: string;
}[] = [
  {
    value: "off",
    label: "Off",
    hint: "Lowest processing overhead; slightly higher latency.",
  },
  {
    value: "balanced",
    label: "Balanced",
    hint: "Good default for most sessions.",
  },
  {
    value: "aggressive",
    label: "Aggressive",
    hint: "Prioritizes minimal delay; may use more compute.",
  },
];

export const TOOL_LABELS: Record<string, string> = {
  web_search: "Web search",
  code_execution: "Code execution",
  file_retrieval: "File retrieval",
  calendar: "Calendar",
  custom_api: "Custom API",
};
