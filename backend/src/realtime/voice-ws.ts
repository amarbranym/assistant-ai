import type { Server as HttpServer } from "http";

/**
 * Voice websocket registration entrypoint.
 *
 * The voice realtime pipeline is implemented elsewhere; this function is kept as
 * the stable server bootstrap hook.
 */
export function registerVoiceWebsocket(_server: HttpServer) {
  // Intentionally a no-op until voice WS is wired.
}

