import {
  FIRST_MESSAGE_MODES,
  MODEL_PROVIDERS,
  STREAMING_LATENCY_MODES,
  TOOL_IDS,
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
  const channels = isRecord(c.channels) ? c.channels : null;
  if (channels) {
    const phone = isRecord(channels.phone) ? channels.phone : null;
    const whatsapp = isRecord(channels.whatsapp) ? channels.whatsapp : null;
    if (phone && typeof phone.enabled === "boolean") {
      base.channelsPhoneEnabled = phone.enabled;
    }
    if (whatsapp && typeof whatsapp.enabled === "boolean") {
      base.channelsWhatsappEnabled = whatsapp.enabled;
    }
    const twilio = phone && isRecord(phone.twilio) ? phone.twilio : null;
    if (twilio && typeof twilio.phoneNumber === "string") {
      base.channelsTwilioPhoneNumber = twilio.phoneNumber;
    } else if (phone && typeof phone.number === "string") {
      base.channelsTwilioPhoneNumber = phone.number;
    }
    if (twilio && typeof twilio.accountSid === "string") {
      base.channelsTwilioAccountSid = twilio.accountSid;
    }
    if (twilio && typeof twilio.authToken === "string") {
      base.channelsTwilioAuthToken = twilio.authToken;
    }
    if (twilio && typeof twilio.label === "string") {
      base.channelsTwilioLabel = twilio.label;
    }
    if (twilio && typeof twilio.smsEnabled === "boolean") {
      base.channelsTwilioSmsEnabled = twilio.smsEnabled;
    }
    if (whatsapp && typeof whatsapp.number === "string") {
      base.channelsWhatsappNumber = whatsapp.number;
    }
    if (whatsapp && typeof whatsapp.businessName === "string") {
      base.channelsWhatsappBusinessName = whatsapp.businessName;
    }
  }

  const model = isRecord(c.model) ? c.model : null;
  if (model) {
    if (typeof model.provider === "string")
      base.modelProvider = asModelProvider(model.provider);
    if (typeof model.model === "string" && model.model.length > 0)
      base.modelId = model.model;
    if (typeof model.temperature === "number" && Number.isFinite(model.temperature))
      base.temperature = model.temperature;
    const messages = Array.isArray(model.messages) ? model.messages : null;
    if (messages) {
      const systemMessage = messages.find(
        (m) =>
          isRecord(m) &&
          m.role === "system" &&
          typeof m.content === "string" &&
          m.content.length > 0
      );
      if (systemMessage && isRecord(systemMessage)) {
        base.systemPrompt = systemMessage.content as string;
      }
    }
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
    const customApi = isRecord(tools.custom_api) ? tools.custom_api : null;
    if (customApi) {
      base.tools.custom_api = true;
      if (typeof customApi.url === "string") base.customApiUrl = customApi.url;
      if (customApi.method === "GET" || customApi.method === "POST") {
        base.customApiMethod = customApi.method;
      }
      if (Array.isArray(customApi.requiredFields)) {
        base.customApiRequiredFields = customApi.requiredFields
          .filter((x): x is string => typeof x === "string")
          .join(",");
      }
      if (isRecord(customApi.headers)) {
        base.customApiHeaders = Object.entries(customApi.headers)
          .slice(0, 20)
          .map(([key, value]) => ({
            key,
            value: typeof value === "string" ? value : JSON.stringify(value)
          }));
      }
    }
  }
  const integrations = isRecord(c.integrations) ? c.integrations : null;
  if (integrations && Array.isArray(integrations.linkedTools)) {
    base.linkedToolIds = integrations.linkedTools.filter(
      (x): x is string => typeof x === "string"
    );
  }
  if (integrations && Array.isArray(integrations.toolConfigs)) {
    base.assistantToolConfigs = integrations.toolConfigs
      .filter(isRecord)
      .map((t) => {
        const provider: "hubspot" | "telecrm" | "custom" =
          t.provider === "hubspot" || t.provider === "telecrm" || t.provider === "custom"
            ? t.provider
            : "custom";
        const authType: "none" | "api_key" | "bearer" =
          t.authType === "none" || t.authType === "api_key" || t.authType === "bearer"
            ? t.authType
            : "none";
        return {
          toolId: typeof t.toolId === "string" ? t.toolId : "",
          name: typeof t.name === "string" ? t.name : "Tool",
          provider,
          enabled: typeof t.enabled === "boolean" ? t.enabled : true,
          endpointUrl: typeof t.endpointUrl === "string" ? t.endpointUrl : "",
          authType,
          authValue: typeof t.authValue === "string" ? t.authValue : "",
          params: Array.isArray(t.params)
            ? t.params
                .filter(isRecord)
                .map((p) => ({
                  id: typeof p.id === "string" ? p.id : crypto.randomUUID(),
                  key: typeof p.key === "string" ? p.key : "",
                  value: typeof p.value === "string" ? p.value : "",
                  required: typeof p.required === "boolean" ? p.required : false
                }))
            : [],
          headers: Array.isArray(t.headers)
            ? t.headers
                .filter(isRecord)
                .map((p) => ({
                  id: typeof p.id === "string" ? p.id : crypto.randomUUID(),
                  key: typeof p.key === "string" ? p.key : "",
                  value: typeof p.value === "string" ? p.value : "",
                  required: typeof p.required === "boolean" ? p.required : false
                }))
            : []
        };
      })
      .filter((x) => x.toolId);
  }

  const knowledge = isRecord(c.knowledge) ? c.knowledge : null;
  if (knowledge && Array.isArray(knowledge.sources)) {
    base.knowledgeSources = knowledge.sources
      .filter(isRecord)
      .map((s) => ({
        id: typeof s.id === "string" ? s.id : crypto.randomUUID(),
        type:
          s.type === "url" || s.type === "text" || s.type === "file"
            ? s.type
            : "text",
        name: typeof s.name === "string" ? s.name : "Untitled source",
        content: typeof s.content === "string" ? s.content : "",
        enabled: typeof s.enabled === "boolean" ? s.enabled : true,
        status:
          s.status === "processing" || s.status === "ready" || s.status === "failed"
            ? s.status
            : "ready",
        lastUpdatedAt:
          typeof s.lastUpdatedAt === "string" ? s.lastUpdatedAt : undefined,
      }));
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
