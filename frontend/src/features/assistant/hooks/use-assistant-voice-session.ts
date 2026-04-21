"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { env } from "@/config/env";
import { getAccessToken } from "@/features/auth/lib/auth-storage";
import { apiRequest, getApiBaseUrl } from "@/lib/api/client";

import { useSileroVad } from "@/features/assistant/hooks/use-silero-vad";

export type VoiceStatus =
  | "ready"
  | "connecting"
  | "listening"
  | "mic_muted"
  | "thinking"
  | "speaking"
  | "interrupted"
  | "ended"
  | "error";

export type VoiceTranscriptEntry = {
  id: string;
  speaker: "user" | "assistant";
  text: string;
};

type CreateVoiceSessionResponse = {
  sessionId: string;
  conversationId: string;
  assistantId: string;
  mode: "test" | "live";
  websocketPath: string;
};

type ClientEvent =
  | {
      type: "session.start";
      assistantId: string;
      conversationId?: string;
      sampleRate?: number;
      mode?: "test" | "live";
    }
  | { type: "audio.chunk"; audio: string; sampleRate?: number }
  | { type: "audio.end" }
  | { type: "assistant.stop" }
  | { type: "ping"; ts?: number };

type ServerEvent =
  | { type: "session.started"; sessionId: string; conversationId: string }
  | { type: "stt.partial"; text: string }
  | { type: "stt.final"; text: string }
  | { type: "assistant.response.started" }
  | { type: "assistant.response.delta"; text: string }
  | { type: "assistant.response.completed"; text: string }
  | { type: "assistant.audio.chunk"; audio: string; mimeType: string }
  | { type: "assistant.audio.completed" }
  | { type: "assistant.interrupted"; reason: string }
  | { type: "pong"; ts: number }
  | { type: "error"; code: string; message: string; fatal?: boolean };

type UseAssistantVoiceSessionInput = {
  assistantId: string;
  mode: "test" | "live";
  conversationId?: string;
  onConversationId: (conversationId: string) => void;
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onAssistantTextDelta?: (delta: string) => void;
};

export type VoiceSessionDebug = {
  lastServerEvent: string;
  approxAudioChunksSent: number;
  websocketReadyState: number | null;
  sessionPipelineReady: boolean;
  micSendsAudio: boolean;
};

type UseAssistantVoiceSessionResult = {
  status: VoiceStatus;
  callActive: boolean;
  isConnected: boolean;
  error: string | null;
  partialTranscript: string;
  assistantLiveText: string;
  transcriptEntries: VoiceTranscriptEntry[];
  micMuted: boolean;
  /** Live Silero VAD signal – true while the user is actively speaking. */
  userSpeaking: boolean;
  /** Populated when `NEXT_PUBLIC_VOICE_DEBUG=true` */
  voiceDebug: VoiceSessionDebug | null;
  start: () => Promise<void>;
  stop: () => void;
  interruptAssistant: () => void;
  toggleMic: () => void;
};

function wsUrlFromPath(path: string): string {
  const base = getApiBaseUrl();
  const u = new URL(base);
  const protocol = u.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${u.host}${path.startsWith("/") ? path : `/${path}`}`;
}

function floatTo16BitPCMBase64(input: Float32Array): string {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(out.buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function downsampleTo16k(input: Float32Array, inputSampleRate: number): Float32Array {
  const targetRate = 16000;
  if (!Number.isFinite(inputSampleRate) || inputSampleRate <= 0 || inputSampleRate === targetRate) {
    return input;
  }
  const ratio = inputSampleRate / targetRate;
  const newLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcIndex = Math.min(input.length - 1, Math.floor(i * ratio));
    output[i] = input[srcIndex] ?? 0;
  }
  return output;
}

export function useAssistantVoiceSession(
  input: UseAssistantVoiceSessionInput
): UseAssistantVoiceSessionResult {
  const [status, setStatus] = useState<VoiceStatus>("ready");
  const [callActive, setCallActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [assistantLiveText, setAssistantLiveText] = useState("");
  const [transcriptEntries, setTranscriptEntries] = useState<VoiceTranscriptEntry[]>([]);
  const [micMuted, setMicMuted] = useState(false);
  // Exposed to the Silero VAD hook so it can observe the *same* MediaStream
  // we use for PCM streaming (no duplicate `getUserMedia` prompt).
  const [vadStream, setVadStream] = useState<MediaStream | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playingAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const pendingAudioBytesRef = useRef<ArrayBuffer[]>([]);
  const playbackActiveRef = useRef(false);
  const lastBargeInAtRef = useRef(0);
  const statusRef = useRef<VoiceStatus>("ready");
  const liveAssistantTextRef = useRef("");
  const interruptedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const micMutedRef = useRef(false);
  const sessionReadyRef = useRef(false);
  const zeroGainRef = useRef<GainNode | null>(null);
  const audioChunksSentRef = useRef(0);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userStoppedRef = useRef(false);
  const micTrackMutedWarningShownRef = useRef(false);
  const maxReconnectAttempts = 3;

  const [voiceDebug, setVoiceDebug] = useState<VoiceSessionDebug | null>(null);

  const setStatusSafe = useCallback((next: VoiceStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const resolveListenStatus = useCallback((): VoiceStatus => {
    return micMutedRef.current ? "mic_muted" : "listening";
  }, []);

  const bumpVoiceDebug = useCallback(
    (patch: Partial<VoiceSessionDebug>) => {
      if (!env.NEXT_PUBLIC_VOICE_DEBUG) return;
      setVoiceDebug((prev) => ({
        lastServerEvent: prev?.lastServerEvent ?? "-",
        approxAudioChunksSent: prev?.approxAudioChunksSent ?? 0,
        websocketReadyState: wsRef.current?.readyState ?? null,
        sessionPipelineReady: sessionReadyRef.current,
        micSendsAudio: !micMutedRef.current && sessionReadyRef.current,
        ...patch
      }));
    },
    []
  );

  const pushTranscript = useCallback((entry: Omit<VoiceTranscriptEntry, "id">) => {
    setTranscriptEntries((prev) => {
      const next = [...prev, { id: crypto.randomUUID(), ...entry }];
      return next.slice(-150);
    });
  }, []);

  const send = useCallback((event: ClientEvent) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(event));
  }, []);

  const toggleMic = useCallback(() => {
    setMicMuted((prev) => {
      const next = !prev;
      micMutedRef.current = next;
      return next;
    });
  }, []);

  const playNextChunk = useCallback(function playNextChunkImpl() {
    if (playbackActiveRef.current) return;
    const next = audioQueueRef.current.shift();
    if (!next) return;

    playbackActiveRef.current = true;
    const audio = new Audio(next);
    playingAudioRef.current = audio;
    setStatusSafe("speaking");

    const release = () => {
      URL.revokeObjectURL(next);
      playbackActiveRef.current = false;
      playingAudioRef.current = null;
      if (audioQueueRef.current.length > 0) {
        playNextChunkImpl();
      } else if (wsRef.current?.readyState === WebSocket.OPEN) {
        setStatusSafe(micMutedRef.current ? "mic_muted" : "listening");
      }
    };

    audio.onended = release;
    audio.onerror = release;
    void audio.play().catch(() => release());
  }, [setStatusSafe]);

  const stopPlayback = useCallback(() => {
    const active = playingAudioRef.current;
    if (active) {
      active.pause();
      active.currentTime = 0;
    }
    playingAudioRef.current = null;
    audioQueueRef.current = [];
    pendingAudioBytesRef.current = [];
    if (audioFlushTimerRef.current) {
      clearTimeout(audioFlushTimerRef.current);
      audioFlushTimerRef.current = null;
    }
    playbackActiveRef.current = false;
  }, []);

  const flushPendingAudio = useCallback(() => {
    if (pendingAudioBytesRef.current.length === 0) {
      if (!playbackActiveRef.current && audioQueueRef.current.length === 0) {
        setStatusSafe(micMutedRef.current ? "mic_muted" : "listening");
      }
      return;
    }
    const blob = new Blob(pendingAudioBytesRef.current, { type: "audio/mpeg" });
    pendingAudioBytesRef.current = [];
    const url = URL.createObjectURL(blob);
    audioQueueRef.current.push(url);
    playNextChunk();
  }, [playNextChunk, setStatusSafe]);

  const interruptAssistant = useCallback(() => {
    stopPlayback();
    send({ type: "assistant.stop" });
    setStatusSafe("interrupted");
    if (interruptedTimerRef.current) clearTimeout(interruptedTimerRef.current);
    interruptedTimerRef.current = setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        setStatusSafe(micMutedRef.current ? "mic_muted" : "listening");
      }
    }, 700);
  }, [send, setStatusSafe, stopPlayback]);

  const teardown = useCallback((markEnded: boolean, nextStatus?: VoiceStatus) => {
    try {
      send({ type: "audio.end" });
    } catch {
      // no-op
    }
    wsRef.current?.close();
    wsRef.current = null;

    processorRef.current?.disconnect();
    zeroGainRef.current?.disconnect();
    zeroGainRef.current = null;
    sourceRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setVadStream(null);

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    stopPlayback();
    if (interruptedTimerRef.current) {
      clearTimeout(interruptedTimerRef.current);
      interruptedTimerRef.current = null;
    }
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (audioFlushTimerRef.current) {
      clearTimeout(audioFlushTimerRef.current);
      audioFlushTimerRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    userStoppedRef.current = true;
    reconnectAttemptRef.current = 0;
    micTrackMutedWarningShownRef.current = false;
    liveAssistantTextRef.current = "";
    sessionReadyRef.current = false;
    setCallActive(false);
    setStatusSafe(nextStatus ?? (markEnded ? "ended" : "ready"));
    setPartialTranscript("");
    setAssistantLiveText("");
    setMicMuted(false);
    micMutedRef.current = false;
    audioChunksSentRef.current = 0;
    setVoiceDebug(null);
  }, [send, setStatusSafe, stopPlayback]);

  const start = useCallback(async () => {
    if (
      statusRef.current === "connecting" ||
      statusRef.current === "listening" ||
      statusRef.current === "thinking" ||
      statusRef.current === "speaking" ||
      statusRef.current === "interrupted"
    ) {
      return;
    }

    setStatusSafe("connecting");
    // Preserve existing error banner if we're in a reconnect cycle so the user
    // sees "Reconnecting…" context, but always start with a clean slate on a
    // user-initiated call.
    if (reconnectAttemptRef.current === 0) {
      setError(null);
      setPartialTranscript("");
      setAssistantLiveText("");
      setTranscriptEntries([]);
      userStoppedRef.current = false;
    }
    setMicMuted(false);
    micMutedRef.current = false;
    setCallActive(false);
    liveAssistantTextRef.current = "";
    sessionReadyRef.current = false;
    micTrackMutedWarningShownRef.current = false;
    lastBargeInAtRef.current = 0;
    pendingAudioBytesRef.current = [];

    try {
      const session = await apiRequest<CreateVoiceSessionResponse>("/api/v1/voice/session", {
        method: "POST",
        body: JSON.stringify({
          assistantId: input.assistantId,
          ...(input.conversationId ? { conversationId: input.conversationId } : {}),
          mode: input.mode
        })
      });
      input.onConversationId(session.conversationId);

      const token = getAccessToken();
      const wsUrl = new URL(wsUrlFromPath(session.websocketPath));
      if (token) wsUrl.searchParams.set("token", token);

      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;
      connectTimeoutRef.current = setTimeout(() => {
        if (statusRef.current === "connecting") {
          setError("Voice connection timed out. Check backend server and auth session.");
          setStatusSafe("error");
          ws.close();
        }
      }, 10000);

      ws.onopen = () => {
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        // Successful (re)open resets the backoff counter and clears any
        // "Reconnecting…" banner so the user sees a clean state.
        if (reconnectAttemptRef.current > 0) {
          reconnectAttemptRef.current = 0;
          setError(null);
        }
        if (env.NEXT_PUBLIC_VOICE_DEBUG) {
          console.info("[voice-session] websocket open, sending session.start");
        }
        bumpVoiceDebug({ lastServerEvent: "(client) session.start sent", websocketReadyState: WebSocket.OPEN });
        send({
          type: "session.start",
          assistantId: input.assistantId,
          conversationId: session.conversationId,
          sampleRate: 16000,
          mode: input.mode
        });
        // If websocket opens but backend never acknowledges session.start,
        // avoid getting stuck forever in "connecting".
        connectTimeoutRef.current = setTimeout(() => {
          if (statusRef.current === "connecting" && !sessionReadyRef.current) {
            setError("Voice session did not start. Check backend logs and auth token.");
            setStatusSafe("error");
            try {
              ws.close();
            } catch {
              // no-op
            }
          }
        }, 10000);
      };

      ws.onmessage = (ev) => {
        let event: ServerEvent | null = null;
        try {
          event = JSON.parse(String(ev.data)) as ServerEvent;
        } catch {
          return;
        }
        if (!event) return;

        if (env.NEXT_PUBLIC_VOICE_DEBUG) {
          console.info("[voice-session] server event:", event.type);
        }
        bumpVoiceDebug({
          lastServerEvent: event.type,
          websocketReadyState: wsRef.current?.readyState ?? null,
          sessionPipelineReady: sessionReadyRef.current
        });

        switch (event.type) {
          case "session.started":
            if (connectTimeoutRef.current) {
              clearTimeout(connectTimeoutRef.current);
              connectTimeoutRef.current = null;
            }
            sessionReadyRef.current = true;
            setCallActive(true);
            setStatusSafe(resolveListenStatus());
            break;
          case "stt.partial":
            setPartialTranscript(event.text);
            input.onPartialTranscript?.(event.text);
            break;
          case "stt.final":
            setPartialTranscript("");
            if (event.text.trim()) {
              pushTranscript({ speaker: "user", text: event.text.trim() });
            }
            input.onFinalTranscript?.(event.text);
            break;
          case "assistant.response.started":
            liveAssistantTextRef.current = "";
            setAssistantLiveText("");
            setStatusSafe("thinking");
            break;
          case "assistant.response.delta":
            liveAssistantTextRef.current += event.text;
            setAssistantLiveText(liveAssistantTextRef.current);
            input.onAssistantTextDelta?.(event.text);
            break;
          case "assistant.response.completed": {
            const text = (event.text || liveAssistantTextRef.current).trim();
            if (text) {
              pushTranscript({ speaker: "assistant", text });
            }
            liveAssistantTextRef.current = "";
            setAssistantLiveText("");
            break;
          }
          case "assistant.audio.chunk": {
            const bytes = Uint8Array.from(atob(event.audio), (c) => c.charCodeAt(0));
            if (bytes.byteLength > 0) {
              pendingAudioBytesRef.current.push(bytes.buffer.slice(0));
              setStatusSafe("speaking");
              if (audioFlushTimerRef.current) clearTimeout(audioFlushTimerRef.current);
              audioFlushTimerRef.current = setTimeout(() => {
                flushPendingAudio();
              }, 320);
            }
            break;
          }
          case "assistant.audio.completed":
            if (audioFlushTimerRef.current) {
              clearTimeout(audioFlushTimerRef.current);
              audioFlushTimerRef.current = null;
            }
            flushPendingAudio();
            break;
          case "assistant.interrupted":
            stopPlayback();
            setStatusSafe("interrupted");
            if (interruptedTimerRef.current) clearTimeout(interruptedTimerRef.current);
            interruptedTimerRef.current = setTimeout(() => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                setStatusSafe(micMutedRef.current ? "mic_muted" : "listening");
              }
            }, 700);
            break;
          case "error": {
            const msg = event.message || "";
            const isAborted =
              /aborted|aborterror/i.test(msg) || /aborted/i.test(event.code || "");
            const friendly =
              event.code === "VOICE_PROVIDERS_MISCONFIGURED"
                ? `${event.message}`
                : event.code === "STT_ERROR"
                  ? `Speech-to-text error: ${event.message}. Check DEEPGRAM_API_KEY in backend/.env.`
                  : event.code === "TTS_ERROR"
                    ? `Voice generation error: ${event.message}. Check ELEVENLABS_API_KEY in backend/.env.`
                    : event.code === "VOICE_TURN_FAILED"
                      ? isAborted
                        ? "Assistant reply was interrupted or stopped before it finished."
                        : `Assistant reply failed: ${event.message}. If this persists, check backend/.env for the LLM key that matches your assistant (OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GROQ_API_KEY).`
                      : event.message;
            setError(friendly);
            setStatusSafe("error");
            if (event.fatal) {
              userStoppedRef.current = true;
              try {
                wsRef.current?.close(1000, "fatal-error");
              } catch {
                // no-op
              }
            }
            break;
          }
          default:
            break;
        }
      };

      ws.onerror = () => {
        // Some browsers emit `error` without promptly emitting `close`.
        // Keep the connect-timeout alive while we're still connecting so the
        // UI cannot get stuck forever in "connecting".
        if (
          statusRef.current === "connecting" &&
          connectTimeoutRef.current == null
        ) {
          connectTimeoutRef.current = setTimeout(() => {
            if (statusRef.current === "connecting") {
              setError("Voice connection failed while opening websocket.");
              setStatusSafe("error");
              try {
                ws.close();
              } catch {
                // no-op
              }
            }
          }, 4000);
        }
        if (env.NEXT_PUBLIC_VOICE_DEBUG) {
          console.info("[voice-session] websocket error event");
        }
      };
      ws.onclose = (ev) => {
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }

        const code = ev.code;
        // Explicit auth rejection — don't retry.
        const isAuthFailure = code === 4401 || code === 1008;
        const wasActive = sessionReadyRef.current;
        const canRetry =
          !userStoppedRef.current &&
          !isAuthFailure &&
          wasActive &&
          reconnectAttemptRef.current < maxReconnectAttempts;

        if (canRetry) {
          reconnectAttemptRef.current += 1;
          const attempt = reconnectAttemptRef.current;
          const backoffMs = Math.min(8000, 500 * 2 ** (attempt - 1));
          setStatusSafe("connecting");
          setError(
            `Connection lost (code ${code}). Reconnecting… (attempt ${attempt}/${maxReconnectAttempts})`
          );
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            // Tear down audio graph but keep UI state, then re-run start().
            try {
              processorRef.current?.disconnect();
              zeroGainRef.current?.disconnect();
              sourceRef.current?.disconnect();
            } catch {
              // no-op
            }
            processorRef.current = null;
            zeroGainRef.current = null;
            sourceRef.current = null;
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            setVadStream(null);
            if (audioContextRef.current) {
              void audioContextRef.current.close().catch(() => {});
              audioContextRef.current = null;
            }
            wsRef.current = null;
            sessionReadyRef.current = false;
            void start();
          }, backoffMs);
          return;
        }

        if (statusRef.current === "connecting" && !isAuthFailure) {
          setError(`Voice socket closed during connect (code ${code}).`);
        }
        if (isAuthFailure) {
          setError("Voice session rejected: authentication required.");
        }
        stopPlayback();
        if (
          statusRef.current !== "ready" &&
          statusRef.current !== "ended" &&
          statusRef.current !== "error"
        ) {
          setStatusSafe(isAuthFailure ? "error" : "ended");
        }
        setCallActive(false);
      };

      // Do NOT force AudioContext at 16 kHz. Many browsers ignore the hint or
      // mis-bind the mic graph on Windows, yielding all-zero buffers from
      // ScriptProcessor while the hardware is actually capturing. We use the
      // native sample rate and downsample in `downsampleTo16k` before sending.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: env.NEXT_PUBLIC_VOICE_DISABLE_AEC
          ? {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: true
            }
          : {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
      });
      streamRef.current = stream;
      setVadStream(stream);
      const micTrack = stream.getAudioTracks()[0];

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      if (env.NEXT_PUBLIC_VOICE_DEBUG) {
        console.info("[voice-session] capture graph", {
          audioContextSampleRate: audioContext.sampleRate,
          disableAec: env.NEXT_PUBLIC_VOICE_DISABLE_AEC,
          trackLabel: micTrack?.label,
          trackMuted: micTrack?.muted,
          trackEnabled: micTrack?.enabled,
          trackReadyState: micTrack?.readyState,
          settings: micTrack?.getSettings?.()
        });
      }
      if (micTrack?.muted && !micTrackMutedWarningShownRef.current) {
        micTrackMutedWarningShownRef.current = true;
        setError(
          "Microphone track is muted by browser/OS (track.muted=true). Check Windows mic privacy, selected input device, and any hardware mute key."
        );
      }
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Mic → 16 kHz PCM → WebSocket. Client-side barge-in has moved to the
      // Silero VAD hook (`useSileroVad`) which fires on `onSpeechStart` with
      // far fewer false positives than RMS thresholding. Deepgram's
      // server-side `SpeechStarted` remains the authoritative signal.
      processor.onaudioprocess = (e) => {
        if (micMutedRef.current || !sessionReadyRef.current) return;
        const raw = e.inputBuffer.getChannelData(0);
        const data = downsampleTo16k(raw, audioContext.sampleRate);
        const pcmBase64 = floatTo16BitPCMBase64(data);
        send({ type: "audio.chunk", audio: pcmBase64, sampleRate: 16000 });
        audioChunksSentRef.current += 1;
        // Client-side mic level probe. Mirrors the backend check so you can
        // tell from the browser console alone whether the browser is feeding
        // us real audio or pure silence.
        if (audioChunksSentRef.current % 50 === 1) {
          let rawPeak = 0;
          for (let i = 0; i < raw.length; i++) {
            const s = raw[i];
            const abs = s < 0 ? -s : s;
            if (abs > rawPeak) rawPeak = abs;
          }
          let sumSq = 0;
          let peak = 0;
          for (let i = 0; i < data.length; i++) {
            const s = data[i];
            sumSq += s * s;
            const abs = s < 0 ? -s : s;
            if (abs > peak) peak = abs;
          }
          const rms = data.length ? Math.sqrt(sumSq / data.length) : 0;
          const level =
            peak < 0.0005 ? "SILENT (mic producing 0s)" : peak < 0.02 ? "very quiet" : "ok";
          if (env.NEXT_PUBLIC_VOICE_DEBUG || peak < 0.0005) {
            console.info(
              `[voice-session] mic level #${audioChunksSentRef.current} sr=${audioContext.sampleRate} rawPeak=${rawPeak.toFixed(3)} outPeak=${peak.toFixed(3)} rms=${rms.toFixed(4)} -> ${level}`
            );
          }
          if (
            rawPeak < 0.0005 &&
            micTrack?.muted &&
            !micTrackMutedWarningShownRef.current
          ) {
            micTrackMutedWarningShownRef.current = true;
            setError(
              "Microphone is connected but browser reports it muted (track.muted=true). Unmute at OS/device level, then restart the call."
            );
          }
          if (env.NEXT_PUBLIC_VOICE_DEBUG) {
            bumpVoiceDebug({
              approxAudioChunksSent: audioChunksSentRef.current,
              micSendsAudio: true
            });
          }
        }
      };

      const zeroGain = audioContext.createGain();
      zeroGain.gain.value = 0;
      zeroGainRef.current = zeroGain;
      source.connect(processor);
      processor.connect(zeroGain);
      zeroGain.connect(audioContext.destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice session failed");
      teardown(false, "error");
    }
  }, [
    bumpVoiceDebug,
    flushPendingAudio,
    input,
    interruptAssistant,
    pushTranscript,
    resolveListenStatus,
    send,
    setStatusSafe,
    stopPlayback,
    teardown
  ]);

  useEffect(() => {
    if (!env.NEXT_PUBLIC_VOICE_DEBUG || !callActive) return;
    const id = window.setInterval(() => {
      bumpVoiceDebug({
        websocketReadyState: wsRef.current?.readyState ?? null,
        sessionPipelineReady: sessionReadyRef.current,
        micSendsAudio: !micMutedRef.current && sessionReadyRef.current,
        approxAudioChunksSent: audioChunksSentRef.current
      });
    }, 2000);
    return () => window.clearInterval(id);
  }, [bumpVoiceDebug, callActive]);

  // --- Silero VAD (browser, via @ricky0123/vad-web) -------------------------
  // Runs on the same MediaStream we already captured so there's no duplicate
  // mic prompt. It replaces the old RMS threshold barge-in with a much more
  // reliable speech-probability model.
  const handleVadSpeechStart = useCallback(() => {
    if (!playbackActiveRef.current) return;
    const now = Date.now();
    if (now - lastBargeInAtRef.current < 450) return;
    lastBargeInAtRef.current = now;
    interruptAssistant();
  }, [interruptAssistant]);

  const { userSpeaking } = useSileroVad({
    stream: vadStream,
    // `NEXT_PUBLIC_DISABLE_SILERO_VAD=true` fully disables the hook – useful for
    // bisecting audio-pipeline issues (e.g. "is Silero interacting with AEC?").
    enabled: callActive && !micMuted && !env.NEXT_PUBLIC_DISABLE_SILERO_VAD,
    onSpeechStart: handleVadSpeechStart
  });

  const stop = useCallback(() => {
    teardown(true);
  }, [teardown]);

  useEffect(() => {
    return () => {
      teardown(false);
    };
  }, [teardown]);

  useEffect(() => {
    if (!callActive) return;
    if (status === "thinking" || status === "speaking" || status === "connecting" || status === "error") {
      return;
    }
    if (micMuted && (status === "listening" || status === "interrupted")) {
      setStatusSafe("mic_muted");
      return;
    }
    if (!micMuted && status === "mic_muted") {
      setStatusSafe("listening");
    }
  }, [callActive, micMuted, status, setStatusSafe]);

  return {
    status,
    callActive,
    isConnected: callActive && status !== "error",
    error,
    partialTranscript,
    assistantLiveText,
    transcriptEntries,
    micMuted,
    userSpeaking,
    voiceDebug: env.NEXT_PUBLIC_VOICE_DEBUG ? voiceDebug : null,
    start,
    stop,
    interruptAssistant,
    toggleMic
  };
}

