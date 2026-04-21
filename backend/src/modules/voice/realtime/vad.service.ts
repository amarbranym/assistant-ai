export type VadEvents = {
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
};

export type VadService = {
  processPcmChunk: (chunk: Buffer, nowMs?: number) => void;
  reset: () => void;
  isSpeechActive: () => boolean;
};

function rmsEnergyPcm16leMono(chunk: Buffer): number {
  if (chunk.length < 2) return 0;
  let sumSq = 0;
  let n = 0;
  for (let i = 0; i + 1 < chunk.length; i += 2) {
    const sample = chunk.readInt16LE(i) / 32768;
    sumSq += sample * sample;
    n++;
  }
  if (n === 0) return 0;
  return Math.sqrt(sumSq / n);
}

export function createVadService(input: {
  energyThreshold?: number;
  silenceMs?: number;
  events: VadEvents;
}): VadService {
  const threshold = input.energyThreshold ?? 0.014;
  const silenceMs = input.silenceMs ?? 650;

  let speaking = false;
  let lastSpeechAt = 0;

  return {
    processPcmChunk(chunk: Buffer, nowMs = Date.now()) {
      const energy = rmsEnergyPcm16leMono(chunk);
      const isSpeech = energy >= threshold;

      if (isSpeech) {
        lastSpeechAt = nowMs;
        if (!speaking) {
          speaking = true;
          input.events.onSpeechStart();
        }
        return;
      }

      if (speaking && nowMs - lastSpeechAt >= silenceMs) {
        speaking = false;
        input.events.onSpeechEnd();
      }
    },
    reset() {
      speaking = false;
      lastSpeechAt = 0;
    },
    isSpeechActive() {
      return speaking;
    }
  };
}

