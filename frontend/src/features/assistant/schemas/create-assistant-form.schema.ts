import { z } from "zod";

export const MODEL_PROVIDERS = [
  "openai",
  "groq",
  "anthropic",
  "google",
  "azure",
  "other",
] as const;

export const TOOL_IDS = [
  "web_search",
  "code_execution",
  "file_retrieval",
  "calendar",
  "custom_api",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export const FIRST_MESSAGE_MODES = [
  "assistant_generated",
  "user_first",
  "assistant_custom",
] as const;

export type FirstMessageMode = (typeof FIRST_MESSAGE_MODES)[number];

export const FIRST_MESSAGE_MODE_OPTIONS: {
  value: FirstMessageMode;
  title: string;
  hint: string;
}[] = [
  {
    value: "assistant_generated",
    title: "Assistant speaks first",
    hint: "The model generates an opening message when the session starts.",
  },
  {
    value: "user_first",
    title: "Assistant waits for user",
    hint: "The conversation starts only after the user sends a message.",
  },
  {
    value: "assistant_custom",
    title: "Assistant speaks first with custom message",
    hint: "Optional — you can set a fixed opening line below.",
  },
];

const toolsShape = TOOL_IDS.reduce(
  (acc, id) => {
    acc[id] = z.boolean();
    return acc;
  },
  {} as Record<ToolId, z.ZodBoolean>
);

const toolsSchema = z.object(toolsShape);

const advancedEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
});

const knowledgeSourceSchema = z.object({
  id: z.string(),
  type: z.enum(["url", "text", "file"]),
  name: z.string().min(1),
  content: z.string().optional(),
  enabled: z.boolean(),
  status: z.enum(["processing", "ready", "failed"]),
  lastUpdatedAt: z.string().optional(),
});

const headerEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
});

const assistantToolParamSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  required: z.boolean(),
});

const assistantToolConfigSchema = z.object({
  toolId: z.string(),
  name: z.string(),
  provider: z.enum(["hubspot", "telecrm", "custom"]),
  enabled: z.boolean(),
  endpointUrl: z.string(),
  authType: z.enum(["none", "api_key", "bearer"]),
  authValue: z.string(),
  params: z.array(assistantToolParamSchema),
  headers: z.array(assistantToolParamSchema),
});

export const STREAMING_LATENCY_MODES = ["off", "balanced", "aggressive"] as const;

export type StreamingLatencyMode = (typeof STREAMING_LATENCY_MODES)[number];

export const createAssistantFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  /** Shown on full editor (edit page); always true for new assistants from the form. */
  active: z.boolean(),
  channelsPhoneEnabled: z.boolean(),
  channelsWhatsappEnabled: z.boolean(),
  channelsTwilioPhoneNumber: z.string().optional(),
  channelsTwilioAccountSid: z.string().optional(),
  channelsTwilioAuthToken: z.string().optional(),
  channelsTwilioLabel: z.string().optional(),
  channelsTwilioSmsEnabled: z.boolean(),
  channelsWhatsappNumber: z.string().optional(),
  channelsWhatsappBusinessName: z.string().optional(),
  modelProvider: z.enum(MODEL_PROVIDERS),
  modelId: z.string().min(1, "Select a model"),
  firstMessageMode: z.enum(FIRST_MESSAGE_MODES),
  firstMessage: z.string().optional(),
  systemPrompt: z.string().optional(),
  maxTokens: z.coerce.number().min(256).max(200000),
  temperature: z.coerce.number().min(0).max(2),
  useVoiceIdManually: z.boolean(),
  voiceCatalogId: z.string().min(1, "Select a voice"),
  voiceManualId: z.string().optional(),
  voiceStability: z.coerce.number().min(0).max(1),
  voiceSimilarity: z.coerce.number().min(0).max(1),
  voiceSpeed: z.coerce.number().min(0.5).max(2),
  voiceStyleExaggeration: z.coerce.number().min(0).max(1),
  backgroundSound: z.string().min(1, "Select a background sound"),
  backgroundSoundUrl: z.string().optional(),
  inputMinCharacters: z.coerce.number().int().min(0).max(100000),
  punctuationBoundaries: z.string().optional(),
  optimizeStreamingLatency: z.enum(STREAMING_LATENCY_MODES),
  useSpeakerBoost: z.boolean(),
  voiceAutoMode: z.boolean(),
  knowledgeSources: z.array(knowledgeSourceSchema),
  customApiUrl: z.string().optional(),
  customApiMethod: z.enum(["POST", "GET"]),
  customApiRequiredFields: z.string(),
  customApiHeaders: z.array(headerEntrySchema),
  linkedToolIds: z.array(z.string()),
  assistantToolConfigs: z.array(assistantToolConfigSchema),
  tools: toolsSchema,
  advancedEntries: z.array(advancedEntrySchema),
}).superRefine((data, ctx) => {
  if (data.useVoiceIdManually && !data.voiceManualId?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Enter a voice ID when using manual entry",
      path: ["voiceManualId"],
    });
  }
  if (data.channelsPhoneEnabled && !data.channelsTwilioPhoneNumber?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Phone number is required when Phone channel is enabled",
      path: ["channelsTwilioPhoneNumber"],
    });
  }
  if (data.channelsPhoneEnabled && !data.channelsTwilioAccountSid?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Twilio Account SID is required when Phone channel is enabled",
      path: ["channelsTwilioAccountSid"],
    });
  }
  if (data.channelsPhoneEnabled && !data.channelsTwilioAuthToken?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Twilio Auth Token is required when Phone channel is enabled",
      path: ["channelsTwilioAuthToken"],
    });
  }
  if (data.channelsWhatsappEnabled && !data.channelsWhatsappNumber?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "WhatsApp number is required when WhatsApp channel is enabled",
      path: ["channelsWhatsappNumber"],
    });
  }
  if (data.tools.custom_api) {
    if (!data.customApiUrl?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Custom API URL is required when Custom API is enabled",
        path: ["customApiUrl"],
      });
    }
  }
});

export type CreateAssistantFormValues = z.infer<typeof createAssistantFormSchema>;

export const defaultCreateAssistantFormValues: CreateAssistantFormValues = {
  name: "",
  description: "",
  active: true,
  channelsPhoneEnabled: true,
  channelsWhatsappEnabled: true,
  channelsTwilioPhoneNumber: "",
  channelsTwilioAccountSid: "",
  channelsTwilioAuthToken: "",
  channelsTwilioLabel: "",
  channelsTwilioSmsEnabled: false,
  channelsWhatsappNumber: "",
  channelsWhatsappBusinessName: "",
  modelProvider: "openai",
  modelId: "gpt-4.1",
  firstMessageMode: "user_first",
  firstMessage: "",
  systemPrompt: "",
  maxTokens: 4096,
  temperature: 0.7,
  useVoiceIdManually: false,
  voiceCatalogId: "voice_rachel",
  voiceManualId: "",
  voiceStability: 0.5,
  voiceSimilarity: 0.75,
  voiceSpeed: 1,
  voiceStyleExaggeration: 0.3,
  backgroundSound: "none",
  backgroundSoundUrl: "",
  inputMinCharacters: 0,
  punctuationBoundaries: "",
  optimizeStreamingLatency: "balanced",
  useSpeakerBoost: true,
  voiceAutoMode: false,
  knowledgeSources: [],
  customApiUrl: "",
  customApiMethod: "POST",
  customApiRequiredFields: "name,email,phone",
  customApiHeaders: [],
  linkedToolIds: [],
  assistantToolConfigs: [],
  tools: TOOL_IDS.reduce(
    (acc, id) => {
      acc[id] = false;
      return acc;
    },
    {} as CreateAssistantFormValues["tools"]
  ),
  advancedEntries: [],
};
