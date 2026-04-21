import { streamElevenLabsSpeech } from "./elevenlabs.provider";

export type TTSProviderRequest = {
  text: string;
  voiceId: string;
  modelId: string;
  abortSignal?: AbortSignal;
  optimizeStreamingLatency?: number;
  voiceStability?: number;
  voiceSimilarityBoost?: number;
  voiceSpeed?: number;
  useSpeakerBoost?: boolean;
  onChunk: (chunk: Buffer, mimeType: string) => Promise<void> | void;
};

export type TTSProvider = {
  id: string;
  streamSpeech: (input: TTSProviderRequest) => Promise<void>;
};

const elevenLabsProvider: TTSProvider = {
  id: "elevenlabs",
  streamSpeech: async (input) => {
    await streamElevenLabsSpeech({
      text: input.text,
      voiceId: input.voiceId,
      modelId: input.modelId,
      abortSignal: input.abortSignal,
      optimizeStreamingLatency: input.optimizeStreamingLatency,
      voiceStability: input.voiceStability,
      voiceSimilarityBoost: input.voiceSimilarityBoost,
      voiceSpeed: input.voiceSpeed,
      useSpeakerBoost: input.useSpeakerBoost,
      onChunk: (chunk) => input.onChunk(chunk, "audio/mpeg")
    });
  }
};

export function resolveTTSProvider(providerId: string): TTSProvider {
  // Fallback keeps runtime stable while more providers are added.
  if (providerId === "elevenlabs") return elevenLabsProvider;
  return elevenLabsProvider;
}
