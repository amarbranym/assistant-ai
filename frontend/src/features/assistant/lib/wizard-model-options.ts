import type { SearchableComboboxOption } from "@/components/ui/searchable-combobox";

import {
  MODEL_PROVIDERS,
  type StreamingLatencyMode,
} from "../schemas/create-assistant-form.schema";

const modelProviderLabels: Record<(typeof MODEL_PROVIDERS)[number], string> = {
  openai: "OpenAI",
  groq: "Groq",
  anthropic: "Anthropic",
  google: "Google",
  azure: "Azure",
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
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini (fast)" },

    { value: "gpt-4.1", label: "GPT-4.1" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },

    { value: "o3-mini", label: "O3 Mini (reasoning)" },
    { value: "o4-mini", label: "O4 Mini (reasoning)" }
  ],
  groq: [
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
    { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
    { value: "llama-3.1-70b-versatile", label: "Llama 3.1 70B Versatile" },
    { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
    { value: "gemma2-9b-it", label: "Gemma 2 9B IT" },
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
