"use client";

import { useChat } from "@ai-sdk/react";
import { Bot, Loader2, SendHorizontal, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { UIMessage } from "ai";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { createSimulatedChatTransport } from "../lib/simulated-chat-transport";
import type { AssistantRecord } from "../types/api-assistant";

function messageText(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

type AssistantChatPanelProps = {
  assistant: AssistantRecord;
};

export function AssistantChatPanel({ assistant }: AssistantChatPanelProps) {
  const transport = useMemo(
    () => createSimulatedChatTransport({ assistantName: assistant.name }),
    [assistant.name]
  );

  const initialMessages = useMemo<UIMessage[]>(() => {
    const desc = assistant.description?.trim();
    const opener = desc
      ? `Hi — I'm ${assistant.name}. ${desc}\n\nReplies here are simulated until you plug in a real model.`
      : `Hi — I'm ${assistant.name}. How can I help you today?\n\nReplies here are simulated until you plug in a real model.`;

    return [
      {
        id: `${assistant.id}-seed-a1`,
        role: "assistant",
        parts: [{ type: "text", text: opener, state: "done" }],
      },
      {
        id: `${assistant.id}-seed-u1`,
        role: "user",
        parts: [
          { type: "text", text: "What can you help me with?", state: "done" },
        ],
      },
      {
        id: `${assistant.id}-seed-a2`,
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "I can brainstorm, summarize, draft messages, and more once your API is connected. Send anything below — you'll get a streaming mock reply.",
            state: "done",
          },
        ],
      },
    ];
  }, [assistant.description, assistant.id, assistant.name]);

  const { messages, sendMessage, status, stop, error } = useChat({
    id: `assistant-drawer-${assistant.id}`,
    transport,
    messages: initialMessages,
  });

  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  async function sendCurrentInput() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendCurrentInput();
  }

  const last = messages.at(-1);
  const lastText = last ? messageText(last) : "";
  const showThinkingDot =
    status === "submitted" ||
    (status === "streaming" &&
      last?.role === "assistant" &&
      lastText.length === 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-linear-to-b from-muted/30 to-background">
      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((m) => {
          const text = messageText(m);
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={cn(
                "flex gap-2",
                isUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              {!isUser ? (
                <div
                  className="bg-primary/15 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl"
                  aria-hidden
                >
                  <Bot className="size-4" />
                </div>
              ) : (
                <div
                  className="bg-muted text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl text-[0.65rem] font-semibold"
                  aria-hidden
                >
                  You
                </div>
              )}
              <div
                className={cn(
                  "max-w-[min(100%,28rem)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                  isUser
                    ? "bg-primary text-primary-foreground rounded-tr-md"
                    : "bg-card border-border rounded-tl-md border"
                )}
              >
                <p className="whitespace-pre-wrap wrap-break-word">{text}</p>
              </div>
            </div>
          );
        })}

        {showThinkingDot ? (
          <div className="flex gap-2">
            <div className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-xl">
              <Loader2 className="size-4 animate-spin" aria-hidden />
            </div>
            <div className="bg-card border-border text-muted-foreground flex items-center gap-2 rounded-2xl rounded-tl-md border px-3.5 py-2.5 text-xs">
              <span className="bg-muted-foreground/50 inline-flex gap-1">
                <span className="bg-primary size-1.5 animate-pulse rounded-full" />
                <span className="bg-primary/70 size-1.5 animate-pulse rounded-full [animation-delay:150ms]" />
                <span className="bg-primary/40 size-1.5 animate-pulse rounded-full [animation-delay:300ms]" />
              </span>
              Thinking…
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="text-destructive px-1 text-xs" role="alert">
            {error.message}
          </p>
        ) : null}
      </div>

      <div className="border-border bg-background/95 supports-backdrop-filter:backdrop-blur-sm shrink-0 border-t p-3">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendCurrentInput();
                }
              }}
              placeholder="Message…"
              rows={2}
              disabled={busy}
              className="border-border bg-muted/40 focus-visible:ring-primary/30 min-h-11 resize-none rounded-xl pr-24 text-sm"
              aria-label="Message"
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {busy ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  className="shrink-0 rounded-lg"
                  onClick={() => void stop()}
                  aria-label="Stop generating"
                >
                  <Square className="size-3.5 fill-current" aria-hidden />
                </Button>
              ) : null}
              <Button
                type="submit"
                size="icon-sm"
                disabled={busy || !input.trim()}
                className="shrink-0 rounded-lg"
                aria-label="Send"
              >
                <SendHorizontal className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground px-0.5 text-[0.65rem]">
            Enter to send · Shift+Enter for newline
          </p>
        </form>
      </div>
    </div>
  );
}
