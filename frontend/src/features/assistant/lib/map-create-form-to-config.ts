import type { CreateAssistantFormValues } from "../schemas/create-assistant-form.schema";

export function mapCreateFormToConfig(
  v: CreateAssistantFormValues
): Record<string, unknown> {
  const customApiHeaders = Object.fromEntries(
    (v.customApiHeaders ?? [])
      .map((h) => [h.key.trim(), h.value] as const)
      .filter(([k]) => k.length > 0)
  );
  const customApiRequiredFields = (v.customApiRequiredFields || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    channels: {
      phone: {
        enabled: v.channelsPhoneEnabled,
        provider: "twilio",
        number: v.channelsTwilioPhoneNumber?.trim() || "",
        twilio: {
          phoneNumber: v.channelsTwilioPhoneNumber?.trim() || "",
          accountSid: v.channelsTwilioAccountSid?.trim() || "",
          authToken: v.channelsTwilioAuthToken?.trim() || "",
          label: v.channelsTwilioLabel?.trim() || "",
          smsEnabled: v.channelsTwilioSmsEnabled
        }
      },
      whatsapp: {
        enabled: v.channelsWhatsappEnabled,
        number: v.channelsWhatsappNumber?.trim() || "",
        businessName: v.channelsWhatsappBusinessName?.trim() || ""
      },
    },
    model: {
      provider: v.modelProvider,
      model: v.modelId,
      temperature: v.temperature,
      messages: v.systemPrompt?.trim()
        ? [{ role: "system", content: v.systemPrompt.trim() }]
        : [],
    },
    voice: {
      provider: "elevenlabs",
      model: "eleven_turbo_v2_5",
      useVoiceIdManually: v.useVoiceIdManually,
      voiceCatalogId: v.voiceCatalogId,
      voiceManualId: v.voiceManualId,
      stability: v.voiceStability,
      similarity: v.voiceSimilarity,
      speed: v.voiceSpeed,
      styleExaggeration: v.voiceStyleExaggeration,
      backgroundSound: v.backgroundSound,
      backgroundSoundUrl: v.backgroundSoundUrl,
      inputMinCharacters: v.inputMinCharacters,
      punctuationBoundaries: v.punctuationBoundaries,
      optimizeStreamingLatency: v.optimizeStreamingLatency,
      useSpeakerBoost: v.useSpeakerBoost,
      voiceAutoMode: v.voiceAutoMode,
    },
    knowledge: {
      enabled: v.knowledgeSources.length > 0,
      sources: v.knowledgeSources,
    },
    integrations: {
      linkedTools: v.linkedToolIds,
      toolConfigs: v.assistantToolConfigs
    },
    tools: {
      ...v.tools,
      ...(v.tools.custom_api
        ? {
            custom_api: {
              url: v.customApiUrl?.trim() || "",
              method: v.customApiMethod,
              requiredFields: customApiRequiredFields,
              headers: customApiHeaders
            }
          }
        : {})
    },
    advanced: v.advancedEntries.filter((e) => e.key.trim().length > 0),
    firstMessageMode: v.firstMessageMode,
    firstMessage: v.firstMessage,
    maxTokens: v.maxTokens,
  };
}
