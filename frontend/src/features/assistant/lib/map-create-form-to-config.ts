import type { CreateAssistantFormValues } from "../schemas/create-assistant-form.schema";

export function mapCreateFormToConfig(
  v: CreateAssistantFormValues
): Record<string, unknown> {
  return {
    model: { provider: v.modelProvider, model: v.modelId },
    voice: {
      provider: v.voiceProvider,
      model: v.voiceModel,
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
    tools: v.tools,
    advanced: v.advancedEntries.filter((e) => e.key.trim().length > 0),
    systemPrompt: v.systemPrompt,
    firstMessageMode: v.firstMessageMode,
    firstMessage: v.firstMessage,
    maxTokens: v.maxTokens,
    temperature: v.temperature,
  };
}
