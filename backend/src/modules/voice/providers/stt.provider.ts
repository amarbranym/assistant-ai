import {
  createDeepgramLiveTranscription,
  type DeepgramListenParams,
  type DeepgramStreamCallbacks,
  type DeepgramStreamHandle
} from "./deepgram.provider";

export type { DeepgramListenParams };

export type STTProviderCallbacks = DeepgramStreamCallbacks;

export type STTProviderHandle = DeepgramStreamHandle;

export type STTProvider = {
  id: string;
  createLiveTranscription: (input: {
    sampleRate: number;
    callbacks: STTProviderCallbacks;
    deepgram?: DeepgramListenParams;
  }) => STTProviderHandle;
};

const defaultListen = (): DeepgramListenParams => ({
  language: process.env.DEEPGRAM_LANGUAGE?.trim() || "multi",
  endpointingMs: 400,
  utteranceEndMs: 1200,
  vadEvents: true
});

const deepgramProvider: STTProvider = {
  id: "deepgram",
  createLiveTranscription: ({ sampleRate, callbacks, deepgram }) =>
    createDeepgramLiveTranscription({
      sampleRate,
      listen: deepgram ?? defaultListen(),
      callbacks
    })
};

export function resolveSTTProvider(providerId: string): STTProvider {
  if (providerId === "deepgram") return deepgramProvider;
  return deepgramProvider;
}
