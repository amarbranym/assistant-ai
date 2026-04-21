import type { IncomingMessage } from "http";
import { URL } from "url";
import WebSocket, { WebSocketServer } from "ws";

import { logger } from "../../../config/logger";
import { verifySupabaseAccessToken } from "../../auth";
import type { STTProviderHandle } from "../providers/stt.provider";
import { resolveSTTProvider } from "../providers/stt.provider";
import { resolveTTSProvider } from "../providers/tts.provider";
import { createAudioProcessor } from "./audio.processor";
import * as voiceService from "../voice.service";
import type {
  AuthenticatedSocketRequest,
  VoiceSessionState,
  VoiceTransportClientEvent,
  VoiceTransportServerEvent
} from "../voice.types";

import { env } from "../../../config/env";

const DEV_USER_ID = process.env.DEV_USER_ID?.trim() || "dev-user";
const ALLOW_DEV_AUTH_FALLBACK = env.allowDevAuthFallback;

function send(ws: WebSocket, event: VoiceTransportServerEvent) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(event));
}

function parseEvent(raw: WebSocket.RawData): VoiceTransportClientEvent | null {
  try {
    const v = JSON.parse(String(raw)) as VoiceTransportClientEvent;
    if (!v || typeof v !== "object" || typeof (v as { type?: unknown }).type !== "string") {
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

function tokenFromRequest(req: IncomingMessage): string | undefined {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  const host = req.headers.host ?? "localhost";
  const url = new URL(req.url ?? "/", `http://${host}`);
  const token = url.searchParams.get("token");
  return token?.trim() || undefined;
}

function isAbortLikeError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === "AbortError") return true;
  const msg = err.message.toLowerCase();
  return msg.includes("aborted") || msg.includes("the user aborted");
}

async function authenticate(req: AuthenticatedSocketRequest): Promise<string> {
  const token = tokenFromRequest(req);
  if (!token) {
    if (!ALLOW_DEV_AUTH_FALLBACK) {
      throw new Error("Missing voice websocket auth token");
    }
    req.userId = DEV_USER_ID;
    return DEV_USER_ID;
  }
  const payload = await verifySupabaseAccessToken(token);
  req.userId = payload.sub;
  return payload.sub;
}

export function attachVoiceWebsocketServer(input: {
  server: import("http").Server;
  path?: string;
}) {
  const wss = new WebSocketServer({
    server: input.server,
    path: input.path ?? "/api/v1/voice/realtime"
  });

  wss.on("connection", async (ws, req: AuthenticatedSocketRequest) => {
    let userId: string = DEV_USER_ID;
    try {
      userId = await authenticate(req);
    } catch (err) {
      if (!ALLOW_DEV_AUTH_FALLBACK) {
        logger.warn({ err }, "Voice websocket auth failed");
        ws.close(4401, "Unauthorized");
        return;
      }
      logger.warn({ err }, "Voice websocket auth failed, using dev user fallback");
      req.userId = DEV_USER_ID;
      userId = DEV_USER_ID;
    }

    let session: VoiceSessionState | null = null;
    let deepgram: STTProviderHandle | null = null;
    let currentSttProvider: ReturnType<typeof resolveSTTProvider> | null = null;
    let processor: ReturnType<typeof createAudioProcessor> | null = null;
    let pendingTurn: Promise<void> = Promise.resolve();
    let lastBargeInAt = 0;
    let lastPartialText = "";
    let lastFinalText = "";
    let lastFinalAt = 0;
    let turnInFlight = false;
    let allowSttReconnect = true;
    const pendingPcmBeforeSession: string[] = [];
    const maxPendingPcmChunks = 240;
    let pcmChunksReceived = 0;

    const queueTurn = (task: () => Promise<void>) => {
      pendingTurn = pendingTurn
        .catch((err) => {
          logger.warn({ err }, "Recovered from previous voice turn failure");
        })
        .then(task)
        .catch((err) => {
          // Normal interruption paths (barge-in, client stop, socket close)
          // can abort an in-flight turn. Do not surface these as VOICE_TURN_FAILED.
          if (isAbortLikeError(err)) {
            logger.info({ err: err.message }, "Voice turn interrupted (abort)");
            return;
          }
          logger.error({ err }, "Voice turn failed");
          send(ws, {
            type: "error",
            code: "VOICE_TURN_FAILED",
            message: err instanceof Error ? err.message : "Voice turn failed"
          });
        });
      return pendingTurn;
    };

    const closeAll = () => {
      allowSttReconnect = false;
      try {
        deepgram?.close();
      } catch {
        // no-op
      }
      deepgram = null;
      currentSttProvider = null;
      lastPartialText = "";
      lastFinalText = "";
      lastFinalAt = 0;
      turnInFlight = false;
      pendingPcmBeforeSession.length = 0;
      if (session) {
        voiceService.interruptAssistantPlayback(session, "socket-closed");
        session.closed = true;
      }
    };

    ws.on("close", closeAll);
    ws.on("error", (err) => {
      logger.warn({ err }, "Voice websocket error");
      closeAll();
    });

    ws.on("message", (raw) => {
      const event = parseEvent(raw);
      if (!event) {
        send(ws, { type: "error", code: "INVALID_EVENT", message: "Invalid websocket event" });
        return;
      }

      if (event.type === "ping") {
        send(ws, { type: "pong", ts: Date.now() });
        return;
      }

      if (event.type === "assistant.stop") {
        if (!session) return;
        const state = voiceService.interruptAssistantPlayback(session, "client-stop");
        if (state.interrupted) {
          send(ws, { type: "assistant.interrupted", reason: state.reason });
        }
        return;
      }

      if (event.type === "audio.chunk") {
        if (processor) {
          processor.ingestBase64Pcm(event.audio);
          pcmChunksReceived += 1;
          // Sample RMS of every 10th chunk to catch "silent mic" scenarios
          // (e.g. OS-level mute, hardware mute, wrong device). High-quality
          // speech typically produces RMS 0.01–0.2; pure silence ~0.0002.
          if (pcmChunksReceived % 10 === 0) {
            try {
              const buf = Buffer.from(event.audio, "base64");
              let sumSq = 0;
              const samples = buf.length / 2;
              let peak = 0;
              for (let i = 0; i < buf.length; i += 2) {
                const s = buf.readInt16LE(i) / 32768;
                sumSq += s * s;
                const abs = s < 0 ? -s : s;
                if (abs > peak) peak = abs;
              }
              const rms = samples > 0 ? Math.sqrt(sumSq / samples) : 0;
              if (pcmChunksReceived === 10 || pcmChunksReceived % 100 === 0) {
                logger.info(
                  {
                    pcmChunksReceived,
                    rms: rms.toFixed(4),
                    peak: peak.toFixed(3),
                    status: rms < 0.002 ? "silent (check mic)" : rms < 0.01 ? "very-quiet" : "speech-level"
                  },
                  "Voice realtime: mic audio level"
                );
              }
            } catch {
              // no-op
            }
          }
          if (pcmChunksReceived === 1 || pcmChunksReceived % 200 === 0) {
            logger.info(
              {
                pcmChunksReceived,
                conversationId: session?.conversationId,
                assistantId: session?.assistant.id
              },
              "Voice realtime: PCM chunks received (client mic → STT pipeline)"
            );
          }
        } else if (pendingPcmBeforeSession.length < maxPendingPcmChunks) {
          pendingPcmBeforeSession.push(event.audio);
        }
        return;
      }

      if (event.type === "audio.end") {
        allowSttReconnect = false;
        processor?.endInput();
        deepgram?.finish();
        return;
      }

      if (event.type === "session.start") {
        queueTurn(async () => {
          try {
            const assistant = await voiceService.getAssistantForVoiceSession({
              assistantId: event.assistantId,
              userId
            });
            const conversation = await voiceService.getOrCreateConversationForVoice({
              assistantId: assistant.id,
              conversationId: event.conversationId
            });
            session = voiceService.createVoiceSessionState({
              userId,
              assistant,
              conversationId: conversation.id,
              sampleRate: event.sampleRate,
              mode: event.mode === "live" ? "live" : "test"
            });

            const voiceConfig = voiceService.resolveVoiceConfig(assistant);
            // Fail-fast if any required provider key is missing so the client
            // gets a clear error instead of an eternal "Listening…" UI.
            voiceService.assertVoiceProviderKeys(voiceConfig, assistant);
            const deepgramListen = {
              language: voiceConfig.deepgramLanguage,
              endpointingMs: voiceConfig.deepgramEndpointingMs,
              utteranceEndMs: voiceConfig.deepgramUtteranceEndMs,
              vadEvents: voiceConfig.deepgramVadEvents
            };
            let firstSttResultLogged = false;

            const tryServerBargeIn = (reason: string) => {
              if (!voiceConfig.autoBargeIn) return;
              if (!session || !session.assistantSpeaking) return;
              const now = Date.now();
              const sinceSpeechStarted =
                session.assistantSpeechStartedAt == null
                  ? Number.POSITIVE_INFINITY
                  : now - session.assistantSpeechStartedAt;
              const sinceLastBargeIn = now - lastBargeInAt;
              if (sinceSpeechStarted < 220 || sinceLastBargeIn < 450) return;
              const out = voiceService.interruptAssistantPlayback(session, reason);
              if (out.interrupted) {
                lastBargeInAt = now;
                send(ws, { type: "assistant.interrupted", reason: out.reason });
              }
            };

            processor = createAudioProcessor({
              vadEnergyThreshold: voiceConfig.vadEnergyThreshold,
              vadSilenceMs: voiceConfig.vadSilenceMs,
              callbacks: {
                onSpeechStart: () => tryServerBargeIn("barge-in"),
                onSpeechEnd: () => {
                  // Utterance boundaries: Deepgram endpointing + UtteranceEnd (see Deepgram docs).
                },
                onAudioChunk: (chunk) => {
                  deepgram?.sendAudioChunk(chunk);
                }
              }
            });

            const sttProvider = resolveSTTProvider(voiceConfig.sttProvider);
            currentSttProvider = sttProvider;
            const ttsProvider = resolveTTSProvider(voiceConfig.ttsProvider);
            const runTurn = (userText: string) => {
              if (!session || session.closed) return;
              const normalized = userText.trim();
              if (!normalized) return;
              const now = Date.now();
              // Drop only rapid duplicate finals from STT (same phrase within ~1.2s).
              if (normalized === lastFinalText && now - lastFinalAt < 1200) return;
              // Prevent partial → final double-fire from starting two LLM turns
              // for effectively the same utterance.
              if (turnInFlight && now - lastFinalAt < 2500) {
                return;
              }
              lastFinalText = normalized;
              lastFinalAt = now;
              lastPartialText = "";
              turnInFlight = true;
              send(ws, { type: "stt.final", text: normalized });
              logger.info(
                {
                  conversationId: session.conversationId,
                  preview: normalized.length > 120 ? `${normalized.slice(0, 120)}…` : normalized
                },
                "Voice: user transcript final → assistant turn"
              );
              queueTurn(async () => {
                if (!session || session.closed) {
                  turnInFlight = false;
                  return;
                }
                const currentVoiceConfig = voiceService.resolveVoiceConfig(session.assistant);
                try {
                  await voiceService.runAssistantVoiceTurn({
                    session,
                    userText: normalized,
                    voiceConfig: currentVoiceConfig,
                    ttsProvider,
                    onTurnStarted: () => send(ws, { type: "assistant.response.started" }),
                    onTextDelta: (delta) =>
                      send(ws, { type: "assistant.response.delta", text: delta }),
                    onTurnCompleted: (finalText) => {
                      send(ws, { type: "assistant.response.completed", text: finalText });
                      send(ws, { type: "assistant.audio.completed" });
                    },
                    onAudioChunk: async (audioChunk, mimeType) => {
                      send(ws, {
                        type: "assistant.audio.chunk",
                        audio: audioChunk.toString("base64"),
                        mimeType
                      });
                    }
                  });
                } finally {
                  turnInFlight = false;
                }
              });
            };
            // Deepgram provides authoritative utterance boundaries via
            // `onTranscriptFinal` (speech_final=true) and `onUtteranceEnd`. The
            // previous safety-net `setTimeout` on partial transcripts raced with
            // these callbacks and occasionally produced duplicate turns, so we
            // now rely on Deepgram's endpointing + utteranceEnd exclusively.
            const sttCallbacks = {
              onTranscriptPartial: (text: string) => {
                send(ws, { type: "stt.partial", text });
                lastPartialText = text.trim();
                // Barge-in only when STT has actual user text while assistant is
                // speaking. This avoids cutting off replies from noisy
                // `speech_started` signals with no meaningful transcript.
                if (
                  session?.assistantSpeaking &&
                  /[a-z0-9\u0900-\u097F]/i.test(lastPartialText) &&
                  lastPartialText.length >= 2
                ) {
                  tryServerBargeIn("deepgram-partial-barge-in");
                }
                if (!firstSttResultLogged) {
                  firstSttResultLogged = true;
                  logger.info(
                    {
                      conversationId: session?.conversationId,
                      pcmChunksReceived,
                      preview: text.length > 80 ? `${text.slice(0, 80)}…` : text
                    },
                    "Voice: Deepgram returned first transcript (pipeline healthy)"
                  );
                }
              },
              onTranscriptFinal: (text: string) => {
                runTurn(text);
              },
              onUtteranceEnd: () => {
                const t = lastPartialText.trim();
                if (t) runTurn(t);
              },
              // `speech_started` is often too eager (echo/noise). We rely on
              // partial transcript text above for barge-in decisions.
              onSpeechStarted: () => {},
              onError: (err: unknown) => {
                logger.warn(
                  { err: err instanceof Error ? err.message : err },
                  "Voice: Deepgram stream error"
                );
                send(ws, {
                  type: "error",
                  code: "STT_ERROR",
                  message: err instanceof Error ? err.message : "Deepgram stream error"
                });
              },
              onClose: () => {
                logger.info(
                  {
                    conversationId: session?.conversationId,
                    receivedFirstTranscript: firstSttResultLogged,
                    pcmChunksReceived
                  },
                  "Voice: Deepgram socket closed"
                );
                deepgram = null;
                if (!allowSttReconnect || !session || session.closed || !currentSttProvider) return;
                try {
                  deepgram = currentSttProvider.createLiveTranscription({
                    sampleRate: session.sampleRate,
                    callbacks: sttCallbacks,
                    deepgram: deepgramListen
                  });
                } catch (err) {
                  send(ws, {
                    type: "error",
                    code: "STT_RECONNECT_FAILED",
                    message: err instanceof Error ? err.message : "Failed to recover STT stream"
                  });
                }
              }
            };
            deepgram = sttProvider.createLiveTranscription({
              sampleRate: session.sampleRate,
              callbacks: sttCallbacks,
              deepgram: deepgramListen
            });

            for (const b64 of pendingPcmBeforeSession) {
              processor.ingestBase64Pcm(b64);
            }
            pendingPcmBeforeSession.length = 0;

            send(ws, {
              type: "session.started",
              sessionId: session.sessionId,
              conversationId: session.conversationId
            });
            logger.info(
              {
                userId,
                assistantId: assistant.id,
                conversationId: conversation.id,
                mode: session.mode,
                deepgramLanguage: voiceConfig.deepgramLanguage
              },
              "Voice session.started (expect client audio.chunk if mic is unmuted)"
            );

            if (voiceConfig.ttsProvider !== "elevenlabs" || voiceConfig.sttProvider !== "deepgram") {
              logger.warn(
                {
                  assistantId: assistant.id,
                  configuredTtsProvider: voiceConfig.ttsProvider,
                  configuredSttProvider: voiceConfig.sttProvider
                },
                "Configured voice providers are not fully wired yet; using Deepgram/ElevenLabs-compatible flow."
              );
            }
          } catch (err) {
            pendingPcmBeforeSession.length = 0;
            const message = err instanceof Error ? err.message : "Failed to start voice session";
            // Forward the AppError code when present (e.g. VOICE_PROVIDERS_MISCONFIGURED)
            // so the client can render an actionable message instead of a generic error.
            const code =
              err && typeof err === "object" && "code" in err && typeof (err as { code?: unknown }).code === "string"
                ? ((err as { code: string }).code)
                : "SESSION_START_FAILED";
            logger.warn({ err: message, code }, "Voice session.start failed");
            send(ws, {
              type: "error",
              code,
              message,
              fatal: true
            });
            try {
              ws.close(1011, code);
            } catch {
              // no-op
            }
          }
        });
      }
    });
  });

  logger.info({ path: input.path ?? "/api/v1/voice/realtime" }, "Voice websocket attached");
  return wss;
}

