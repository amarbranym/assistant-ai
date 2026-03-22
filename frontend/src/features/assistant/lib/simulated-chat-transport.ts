import type { ChatTransport, UIMessage, UIMessageChunk } from "ai";
import { simulateReadableStream } from "ai";

function extractLastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    return m.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
  }
  return "";
}

function buildSimulatedReply(userText: string, assistantName: string): string {
  const preview =
    userText.length > 320 ? `${userText.slice(0, 320)}…` : userText;
  return [
    `Thanks for your message. I'm ${assistantName} — this is a simulated reply (no real model call yet).`,
    "",
    `You said: “${preview || "(empty message)"}”`,
    "",
    "Responses stream through the Vercel AI SDK useChat hook with a custom ChatTransport. Swap in DefaultChatTransport pointing at your API when you're ready.",
  ].join("\n");
}

function textStreamChunks(
  fullText: string,
  textPartId: string
): UIMessageChunk[] {
  const chunks: UIMessageChunk[] = [{ type: "text-start", id: textPartId }];
  const step = 4;
  for (let i = 0; i < fullText.length; i += step) {
    chunks.push({
      type: "text-delta",
      id: textPartId,
      delta: fullText.slice(i, i + step),
    });
  }
  chunks.push({ type: "text-end", id: textPartId });
  chunks.push({ type: "finish", finishReason: "stop" });
  return chunks;
}

function newTextPartId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `text_${Date.now()}`;
}

/**
 * ChatTransport that streams a canned assistant reply (AI SDK UI protocol).
 * No HTTP — for local UX development only.
 */
export function createSimulatedChatTransport(options: {
  assistantName: string;
}): ChatTransport<UIMessage> {
  return {
    sendMessages: async ({ messages, abortSignal }) => {
      const userText = extractLastUserText(messages);
      const reply = buildSimulatedReply(userText, options.assistantName);
      const textPartId = newTextPartId();
      const chunks = textStreamChunks(reply, textPartId);

      return simulateReadableStream({
        chunks,
        initialDelayInMs: 100,
        chunkDelayInMs: 22,
        _internal: {
          delay: async (ms) => {
            if (ms == null) return;
            await new Promise((r) => setTimeout(r, ms));
            if (abortSignal?.aborted) {
              throw new DOMException("Aborted", "AbortError");
            }
          },
        },
      });
    },
    reconnectToStream: async () => null,
  };
}
