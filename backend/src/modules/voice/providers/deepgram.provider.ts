import WebSocket from "ws";

import { logger } from "../../../config/logger";

type DeepgramAlt = { transcript?: string };

type DeepgramTranscriptEvent = {
  type?: string;
  channel?: { alternatives?: DeepgramAlt[] };
  channels?: Array<{ alternatives?: DeepgramAlt[] }>;
  is_final?: boolean;
  speech_final?: boolean;
  error?: string;
  err_code?: string;
  description?: string;
};

/** Query-side tuning for Deepgram live listen (see Deepgram streaming / utterance-end docs). */
export type DeepgramListenParams = {
  language: string;
  endpointingMs: number;
  utteranceEndMs: number | null;
  vadEvents: boolean;
};

export type DeepgramStreamCallbacks = {
  onTranscriptPartial: (text: string) => void;
  onTranscriptFinal: (text: string) => void;
  onUtteranceEnd?: () => void;
  onSpeechStarted?: () => void;
  onError: (err: unknown) => void;
  onClose?: () => void;
};

export type DeepgramStreamHandle = {
  sendAudioChunk: (chunk: Buffer) => void;
  finish: () => void;
  close: () => void;
};

function deepgramApiKey(): string {
  const key = process.env.DEEPGRAM_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing DEEPGRAM_API_KEY");
  }
  return key;
}

function buildListenUrl(sampleRate: number, listen: DeepgramListenParams): string {
  // IMPORTANT: `language=multi` (code-switching, e.g. Hindi ⇄ English) is only
  // supported on Deepgram's `nova-3` model. nova-2 accepts the request but
  // returns empty transcripts. See Deepgram docs.
  const model = listen.language === "multi" ? "nova-3" : "nova-2";

  const params = new URLSearchParams({
    model,
    language: listen.language,
    encoding: "linear16",
    sample_rate: String(sampleRate),
    channels: "1",
    interim_results: "true",
    punctuate: "true",
    smart_format: "true",
    endpointing: String(listen.endpointingMs)
  });

  if (listen.utteranceEndMs != null && listen.utteranceEndMs >= 1000) {
    params.set("utterance_end_ms", String(Math.floor(listen.utteranceEndMs)));
  }
  if (listen.vadEvents) {
    params.set("vad_events", "true");
  }

  return `wss://api.deepgram.com/v1/listen?${params.toString()}`;
}

export function createDeepgramLiveTranscription(input: {
  sampleRate: number;
  listen: DeepgramListenParams;
  callbacks: DeepgramStreamCallbacks;
}): DeepgramStreamHandle {
  const key = deepgramApiKey();
  const sampleRate = Number.isFinite(input.sampleRate) ? input.sampleRate : 16000;
  const url = buildListenUrl(sampleRate, input.listen);
  const model = url.match(/[?&]model=([^&]+)/)?.[1] ?? "unknown";

  logger.info(
    { model, language: input.listen.language, sampleRate },
    "Deepgram: connecting"
  );

  const ws = new WebSocket(url, {
    headers: {
      Authorization: `Token ${key}`
    }
  });
  const queuedChunks: Buffer[] = [];
  const maxQueuedChunks = 200;
  let opened = false;
  let closed = false;
  let keepAlive: ReturnType<typeof setInterval> | null = null;

  const clearKeepAlive = () => {
    if (keepAlive) {
      clearInterval(keepAlive);
      keepAlive = null;
    }
  };

  const openTimeout = setTimeout(() => {
    if (opened || closed) return;
    logger.warn(
      { language: input.listen.language, sampleRate },
      "Deepgram: connection timed out before socket opened (check DEEPGRAM_API_KEY and network)"
    );
    input.callbacks.onError(new Error("Deepgram connection timeout"));
    try {
      ws.close();
    } catch {
      // no-op
    }
  }, 8000);

  ws.on("open", () => {
    opened = true;
    clearTimeout(openTimeout);
    logger.info(
      {
        language: input.listen.language,
        sampleRate,
        endpointingMs: input.listen.endpointingMs,
        utteranceEndMs: input.listen.utteranceEndMs,
        queuedChunks: queuedChunks.length
      },
      "Deepgram: socket open, flushing queued audio"
    );
    while (queuedChunks.length > 0 && ws.readyState === WebSocket.OPEN) {
      const chunk = queuedChunks.shift();
      if (!chunk) break;
      ws.send(chunk);
    }
    keepAlive = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: "KeepAlive" }));
        } catch {
          // no-op
        }
      }
    }, 8000);
  });

  let resultsSeen = 0;
  let resultsWithText = 0;

  ws.on("message", (data) => {
    try {
      const payload = JSON.parse(String(data)) as DeepgramTranscriptEvent & Record<string, unknown>;
      if (payload.err_code || payload.error || payload.description) {
        const parts = [payload.err_code, payload.description, payload.error].filter(Boolean);
        logger.warn({ payload }, "Deepgram: error payload");
        input.callbacks.onError(new Error(`Deepgram: ${parts.join(" — ") || "unknown error"}`));
        return;
      }

      const msgType = payload.type;
      if (msgType === "UtteranceEnd") {
        input.callbacks.onUtteranceEnd?.();
        return;
      }
      if (msgType === "SpeechStarted") {
        input.callbacks.onSpeechStarted?.();
        return;
      }
      if (msgType === "Metadata") {
        // Log metadata once so operators can confirm Deepgram "saw" their audio.
        logger.info({ metadata: payload }, "Deepgram: metadata received");
        return;
      }
      if (msgType === "CloseStream") {
        return;
      }

      let text =
        payload.channel?.alternatives?.[0]?.transcript?.trim() ||
        payload.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ||
        "";

      resultsSeen += 1;
      if (text) resultsWithText += 1;

      // Heartbeat every 50 Results to prove Deepgram is actively responding
      // even when the audio is silence / non-speech (keeps ops visibility).
      if (resultsSeen === 1 || resultsSeen % 50 === 0) {
        logger.info(
          { resultsSeen, resultsWithText, hasText: Boolean(text) },
          resultsWithText === 0
            ? "Deepgram: receiving responses but no speech detected yet (check mic/volume/language)"
            : "Deepgram: actively transcribing"
        );
      }

      if (!text) return;

      const isFinal = Boolean(payload.is_final || payload.speech_final);
      if (isFinal) {
        input.callbacks.onTranscriptFinal(text);
      } else {
        input.callbacks.onTranscriptPartial(text);
      }
    } catch (err) {
      input.callbacks.onError(err);
    }
  });

  ws.on("error", (err) => {
    clearTimeout(openTimeout);
    logger.warn(
      { err: err instanceof Error ? err.message : err },
      "Deepgram: websocket error"
    );
    input.callbacks.onError(err);
  });
  ws.on("close", (code, reasonBuffer) => {
    closed = true;
    clearTimeout(openTimeout);
    clearKeepAlive();
    const reason = reasonBuffer?.toString() || "";
    if (!opened) {
      // Most common causes: invalid DEEPGRAM_API_KEY (401/1008),
      // unreachable network, or rate-limit. Surface a loud log so operators
      // see it alongside the client `STT_ERROR` event.
      logger.error(
        { code, reason },
        "Deepgram: socket closed BEFORE ready — check DEEPGRAM_API_KEY and network"
      );
      input.callbacks.onError(
        new Error(`Deepgram socket closed (${code}): ${reason || "connection closed before ready"}`)
      );
    } else {
      logger.info({ code, reason }, "Deepgram: socket closed after session");
    }
    input.callbacks.onClose?.();
  });

  return {
    sendAudioChunk: (chunk: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(chunk);
        return;
      }
      if (ws.readyState === WebSocket.CONNECTING) {
        queuedChunks.push(Buffer.from(chunk));
        if (queuedChunks.length > maxQueuedChunks) {
          queuedChunks.shift();
        }
      }
    },
    finish: () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "Finalize" }));
      }
    },
    close: () => {
      clearKeepAlive();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    }
  };
}
