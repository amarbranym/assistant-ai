import type { Server as HttpServer } from "http";
import { attachVoiceWebsocketServer } from "../modules/voice/realtime/websocket.handler";

/**
 * Voice websocket registration entrypoint.
 *
 * The voice realtime pipeline is implemented elsewhere; this function is kept as
 * the stable server bootstrap hook.
 */
export function registerVoiceWebsocket(server: HttpServer) {
  attachVoiceWebsocketServer({
    server,
    path: "/api/v1/voice/realtime"
  });
}

