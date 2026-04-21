import { createVadService, type VadService } from "./vad.service";

export type AudioProcessorCallbacks = {
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
  onAudioChunk: (chunk: Buffer) => void;
};

export type AudioProcessor = {
  ingestBase64Pcm: (base64Audio: string) => void;
  endInput: () => void;
  reset: () => void;
};

export function createAudioProcessor(input: {
  callbacks: AudioProcessorCallbacks;
  vad?: VadService;
  /** When no custom `vad`, build RMS VAD with these thresholds (server-side barge-in). */
  vadEnergyThreshold?: number;
  vadSilenceMs?: number;
}): AudioProcessor {
  const vad =
    input.vad ??
    createVadService({
      energyThreshold: input.vadEnergyThreshold,
      silenceMs: input.vadSilenceMs,
      events: {
        onSpeechStart: input.callbacks.onSpeechStart,
        onSpeechEnd: input.callbacks.onSpeechEnd
      }
    });

  return {
    ingestBase64Pcm(base64Audio: string) {
      const chunk = Buffer.from(base64Audio, "base64");
      if (chunk.byteLength === 0) return;
      input.callbacks.onAudioChunk(chunk);
      vad.processPcmChunk(chunk);
    },
    endInput() {
      // Force an end if VAD still thinks we are speaking.
      if (vad.isSpeechActive()) {
        input.callbacks.onSpeechEnd();
      }
      vad.reset();
    },
    reset() {
      vad.reset();
    }
  };
}

