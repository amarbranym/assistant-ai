"use client";

// Thin React wrapper around `@ricky0123/vad-web` (Silero VAD in the browser).
//
// The raw library is dynamic-imported so Next.js doesn't try to bundle the
// onnxruntime-web worker/WASM into the server build. Assets (worklet + ONNX
// model + onnxruntime WASM) are self-hosted under `/vad/` by
// `scripts/copy-vad-assets.mjs` — no CDN dependency.
//
// Why this exists:
//   • The previous barge-in used a crude RMS threshold inside
//     `onaudioprocess`, which false-fires on keyboard clicks, fans, and
//     sibilants. Silero is dramatically more reliable.
//   • We also use it to expose `userSpeaking` for live UI feedback.
//
// Important: the VAD reuses the *same* MediaStream already acquired by the
// caller (via the `getStream` option). We do NOT request the microphone a
// second time — that would either prompt again or create a duplicate track.

import { useCallback, useEffect, useRef, useState } from "react";

type MicVADInstance = {
  start: () => void;
  pause: () => void;
  listening: boolean;
};

type VadWebModule = {
  MicVAD: {
    new: (options: Record<string, unknown>) => Promise<MicVADInstance>;
  };
};

export type UseSileroVadInput = {
  /**
   * The already-acquired microphone stream. Pass `null` to disable/tear down.
   * The VAD will reuse this stream (no second `getUserMedia` call).
   */
  stream: MediaStream | null;
  enabled: boolean;
  onSpeechStart?: () => void;
  onSpeechEnd?: (audio: Float32Array) => void;
  /** Called on every VAD frame with `isSpeech` probability (0..1). */
  onFrame?: (probIsSpeech: number) => void;
  /** Silero model variant. `v5` is newer/better; `legacy` is the default bundled. */
  model?: "v5" | "legacy";
  /** Positive speech probability threshold (0..1). Default 0.5 is stricter than lib default. */
  positiveSpeechThreshold?: number;
  /** Negative speech probability threshold (0..1). Default 0.35. */
  negativeSpeechThreshold?: number;
  /** Milliseconds of silence after speech before `onSpeechEnd` fires. */
  redemptionMs?: number;
  /** Minimum speech duration to consider a valid utterance. */
  minSpeechMs?: number;
};

export type UseSileroVadResult = {
  ready: boolean;
  userSpeaking: boolean;
  error: string | null;
};

export function useSileroVad(input: UseSileroVadInput): UseSileroVadResult {
  const [ready, setReady] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSpeechStartRef = useRef(input.onSpeechStart);
  const onSpeechEndRef = useRef(input.onSpeechEnd);
  const onFrameRef = useRef(input.onFrame);
  onSpeechStartRef.current = input.onSpeechStart;
  onSpeechEndRef.current = input.onSpeechEnd;
  onFrameRef.current = input.onFrame;

  const vadRef = useRef<MicVADInstance | null>(null);
  const destroyedRef = useRef(false);

  const teardown = useCallback(() => {
    const v = vadRef.current;
    vadRef.current = null;
    if (v) {
      try {
        v.pause();
      } catch {
        // no-op
      }
    }
    setReady(false);
    setUserSpeaking(false);
  }, []);

  useEffect(() => {
    destroyedRef.current = false;

    if (!input.enabled || !input.stream) {
      teardown();
      return () => {
        destroyedRef.current = true;
      };
    }

    const stream = input.stream;

    (async () => {
      try {
        const mod = (await import("@ricky0123/vad-web")) as unknown as VadWebModule;
        if (destroyedRef.current) return;

        const vad = await mod.MicVAD.new({
          model: input.model ?? "v5",
          baseAssetPath: "/vad/",
          onnxWASMBasePath: "/vad/",
          positiveSpeechThreshold: input.positiveSpeechThreshold ?? 0.5,
          negativeSpeechThreshold: input.negativeSpeechThreshold ?? 0.35,
          redemptionMs: input.redemptionMs ?? 700,
          minSpeechMs: input.minSpeechMs ?? 250,
          // Reuse the caller's stream – prevents a second `getUserMedia` and
          // keeps barge-in fully synchronized with the PCM we stream to the
          // backend STT pipeline.
          getStream: async () => stream,
          pauseStream: async () => {
            // Parent owns the stream lifecycle; do NOT stop tracks on pause.
          },
          resumeStream: async () => stream,
          onSpeechStart: () => {
            if (destroyedRef.current) return;
            setUserSpeaking(true);
            onSpeechStartRef.current?.();
          },
          onSpeechEnd: (audio: Float32Array) => {
            if (destroyedRef.current) return;
            setUserSpeaking(false);
            onSpeechEndRef.current?.(audio);
          },
          onVADMisfire: () => {
            if (destroyedRef.current) return;
            setUserSpeaking(false);
          },
          onFrameProcessed: (probs: { isSpeech: number; notSpeech: number }) => {
            if (destroyedRef.current) return;
            onFrameRef.current?.(probs.isSpeech);
          }
        });

        if (destroyedRef.current) {
          try {
            vad.pause();
          } catch {
            // no-op
          }
          return;
        }

        vadRef.current = vad;
        vad.start();
        setReady(true);
      } catch (err) {
        if (destroyedRef.current) return;
        const message = err instanceof Error ? err.message : "Failed to load Silero VAD";
        console.warn("[silero-vad] init failed:", message);
        setError(message);
        setReady(false);
      }
    })();

    return () => {
      destroyedRef.current = true;
      teardown();
    };
  }, [
    input.enabled,
    input.stream,
    input.model,
    input.positiveSpeechThreshold,
    input.negativeSpeechThreshold,
    input.redemptionMs,
    input.minSpeechMs,
    teardown
  ]);

  return { ready, userSpeaking, error };
}
