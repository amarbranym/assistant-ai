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

const MODEL_ID_OPTIONS_BY_PROVIDER: Record<
  (typeof MODEL_PROVIDERS)[number],
  SearchableComboboxOption[]
> = {
  openai: [
    { value: "gpt-5.4", label: "GPT-5.4 (Latest)" },
    { value: "gpt-5.4-mini", label: "GPT-5.4 Mini" },
    { value: "gpt-5.4-nano", label: "GPT-5.4 Nano" },
  
    { value: "gpt-5.1", label: "GPT-5.1" },
    { value: "gpt-5-mini", label: "GPT-5 Mini" },
    { value: "gpt-5-nano", label: "GPT-5 Nano" },
  
    { value: "gpt-4.1", label: "GPT-4.1" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
  
    { value: "gpt-4o", label: "GPT-4o" },
  
    { value: "o3", label: "O3 (Reasoning)" },
    { value: "o3-mini", label: "O3 Mini" },
    { value: "o4-mini", label: "O4 Mini" }
  ],
  anthropic: [
    { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-opus", label: "Claude 3 Opus" },
  ],
  google: [  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
  
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  
    { value: "gemini-3-pro", label: "Gemini 3 Pro" },
    { value: "gemini-3-flash", label: "Gemini 3 Flash" },
  
    { value: "gemini-3.1-pro", label: "Gemini 3.1 Pro" },
    { value: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" }],
  azure: [
    { value: "gpt-4.1", label: "GPT-4.1 (Azure)" },
    { value: "gpt-4o", label: "GPT-4o (Azure)" },
  ],
  other: [
    { value: "custom-model", label: "Custom model" },
    { value: "gpt-4.1", label: "GPT-4.1" },
    { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  ],
};

/** Backward-compatible full list of model options. */
export const MODEL_ID_COMBO_OPTIONS: SearchableComboboxOption[] = Array.from(
  new Map(
    Object.values(MODEL_ID_OPTIONS_BY_PROVIDER)
      .flat()
      .map((option) => [option.value, option] as const)
  ).values()
);

export function getModelIdOptionsForProvider(
  provider: (typeof MODEL_PROVIDERS)[number]
): SearchableComboboxOption[] {
  return MODEL_ID_OPTIONS_BY_PROVIDER[provider];
}

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
