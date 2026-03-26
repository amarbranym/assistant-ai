/**
 * Websocket streaming is not required for the current HTTP streaming path.
 * If/when we add WS chat, implement a handler that:
 * - authenticates the socket (reuse existing auth patterns)
 * - maps messages to conversations
 * - streams model deltas over WS with backpressure/abort support
 */
export type ChatWebsocketHandler = {
  // TODO: implement when websocket chat is introduced
};

