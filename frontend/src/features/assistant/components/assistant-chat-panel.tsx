"use client";

import { useChat } from "@ai-sdk/react";
import {
  AlertTriangle,
  Bot,
  ChevronDown,
  Loader2,
  RotateCcw,
  SendHorizontal,
  Square,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { env } from "@/config/env";
import { getAccessToken } from "@/features/auth/lib/auth-storage";
import { getApiBaseUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";

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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function AssistantChatPanel({ assistant }: AssistantChatPanelProps) {
  const [conversationId, setConversationId] = useState<string | undefined>();

  const transport = useMemo(() => {
    return new DefaultChatTransport<UIMessage>({
      api: `${getApiBaseUrl()}/api/v1/chat/stream`,
      credentials: "omit",
      headers: async () => {
        const headers: Record<string, string> = {};
        const token = getAccessToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const key = env.NEXT_PUBLIC_API_KEY;
        if (key) headers["x-api-key"] = key;
        return headers;
      },
      body: () => ({}),
      prepareSendMessagesRequest: ({ body, id, messages, trigger, messageId }) => {
        return {
          body: {
            ...body,
            assistantId: assistant.id,
            ...(conversationId ? { conversationId } : {}),
            id,
            messages,
            trigger,
            ...(messageId ? { messageId } : {}),
          },
        };
      },
      fetch: async (input, init) => {
        const res = await fetch(input, init);
        const cid = res.headers.get("x-conversation-id");
        if (cid) setConversationId(cid);
        return res;
      },
    });
  }, [assistant.id, conversationId]);

  const initialMessages = useMemo<UIMessage[]>(() => {
    const desc = assistant.description?.trim();
    const opener = desc
      ? `Hi — I'm ${assistant.name}. ${desc}`
      : `Hi — I'm ${assistant.name}. How can I help you today?`;

    return [
      {
        id: `${assistant.id}-seed-a1`,
        role: "assistant",
        parts: [{ type: "text", text: opener, state: "done" }],
      },
    ];
  }, [assistant.description, assistant.id, assistant.name]);

  const { messages, sendMessage, status, stop, error, regenerate, clearError } =
    useChat({
    id: `assistant-drawer-${assistant.id}`,
    messages: initialMessages,
    transport,
  });

  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const busy = status === "submitted" || status === "streaming";

  const scrollToBottom = (behavior: ScrollBehavior) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  useEffect(() => {
    if (!stickToBottom) return;
    scrollToBottom("smooth");
  }, [messages, status, stickToBottom]);

  function handleScroll() {
    const el = listRef.current;
    if (!el) return;
    const thresholdPx = 24;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= thresholdPx;
    setStickToBottom(atBottom);
  }

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    // Auto-grow to content (within a reasonable cap).
    el.style.height = "0px";
    const next = clamp(el.scrollHeight, 44, 160);
    el.style.height = `${next}px`;
  }, [input]);

  async function sendCurrentInput() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
    clearError();
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
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-gutter:stable]"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((m) => {
            const text = messageText(m);
            const isUser = m.role === "user";
            const showEmpty = !text.trim() && m.role !== "assistant";
            const isLastAssistantStreaming =
              status === "streaming" && last?.id === m.id && m.role === "assistant";
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
                    "max-w-[min(100%,32rem)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                    isUser
                      ? "bg-primary text-primary-foreground rounded-tr-md"
                      : "bg-card border-border rounded-tl-md border"
                  )}
                >
                  {showEmpty ? (
                    <p className="text-muted-foreground">…</p>
                  ) : (
                    <p className="whitespace-pre-wrap wrap-break-word text-pretty">
                      {text}
                      {isLastAssistantStreaming ? (
                        <span
                          className="bg-primary/70 ml-1 inline-block h-4 w-[2px] animate-pulse align-text-bottom"
                          aria-hidden
                        />
                      ) : null}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {showThinkingDot ? (
            <div className="flex gap-2">
              <div className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-xl">
                <Bot className="size-4" aria-hidden />
              </div>
              <div className="bg-card border-border text-muted-foreground flex items-center gap-2 rounded-2xl rounded-tl-md border px-3.5 py-2.5 text-xs">
                <span className="inline-flex items-end gap-1" aria-hidden>
                  <span className="bg-primary size-2 animate-bounce rounded-full [animation-delay:0ms]" />
                  <span className="bg-primary/70 size-2 animate-bounce rounded-full [animation-delay:120ms]" />
                  <span className="bg-primary/40 size-2 animate-bounce rounded-full [animation-delay:240ms]" />
                </span>
                Generating…
              </div>
            </div>
          ) : null}

          {error ? (
            <div
              className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-xl border px-3 py-2 text-xs"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Couldn’t send message</p>
                <p className="text-destructive/90 mt-0.5 wrap-break-word">
                  {error.message}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 rounded-lg"
                onClick={() => void regenerate()}
              >
                <RotateCcw className="mr-1.5 size-3.5" aria-hidden />
                Retry
              </Button>
            </div>
          ) : null}
        </div>

        {!stickToBottom ? (
          <div className="pointer-events-none absolute right-4 bottom-3">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="pointer-events-auto h-8 rounded-full shadow-sm"
              onClick={() => {
                setStickToBottom(true);
                scrollToBottom("smooth");
              }}
            >
              <ChevronDown className="mr-1.5 size-4" aria-hidden />
              Jump to latest
            </Button>
          </div>
        ) : null}
      </div>

      <div className="border-border bg-background/95 supports-backdrop-filter:backdrop-blur-sm shrink-0 border-t p-3">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="relative">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendCurrentInput();
                }
              }}
              placeholder="Message…"
              rows={1}
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
