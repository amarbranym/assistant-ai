import type { Assistant } from "@prisma/client";
import type { IncomingMessage } from "http";

export type VoiceTransportClientEvent =
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

export type VoiceTransportServerEvent =
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

export type VoiceResolvedConfig = {
  ttsProvider: string;
  sttProvider: string;
  model: string;
  voiceId?: string;
  inputMinCharacters: number;
  punctuationBoundaries: string[];
  /** PCM energy VAD on the server (barge-in while assistant speaks). */
  vadEnergyThreshold: number;
  vadSilenceMs: number;
  /** Deepgram listen URL tuning (see Deepgram streaming docs). */
  deepgramLanguage: string;
  deepgramEndpointingMs: number;
  /** Milliseconds of word gap before UtteranceEnd; null disables. Use ≥1000 per Deepgram. */
  deepgramUtteranceEndMs: number | null;
  deepgramVadEvents: boolean;
  /** ElevenLabs stream: 0–4 */
  elevenlabsStreamingLatency: number;
  voiceStability: number;
  voiceSimilarityBoost: number;
  voiceSpeed: number;
  useSpeakerBoost: boolean;
};

export type VoiceSessionState = {
  sessionId: string;
  userId: string;
  assistant: Assistant;
  conversationId: string;
  sampleRate: number;
  mode: "test" | "live";
  assistantSpeaking: boolean;
  assistantSpeechStartedAt: number | null;
  llmAbortController: AbortController | null;
  ttsAbortController: AbortController | null;
  closed: boolean;
};

export type AuthenticatedSocketRequest = IncomingMessage & {
  userId?: string;
};

