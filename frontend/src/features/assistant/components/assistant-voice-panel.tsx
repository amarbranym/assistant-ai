"use client";

import {
  AlertTriangle,
  Bot,
  Loader2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAssistantVoiceSession } from "../hooks/use-assistant-voice-session";
import { useAssistantRuntimeMode } from "../hooks/use-assistant-runtime-mode";
import type { AssistantRecord } from "../types/api-assistant";

type AssistantVoicePanelProps = {
  assistant: AssistantRecord;
};

export function AssistantVoicePanel({ assistant }: AssistantVoicePanelProps) {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const { mode, setMode } = useAssistantRuntimeMode(assistant.id);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  const voice = useAssistantVoiceSession({
    assistantId: assistant.id,
    mode,
    conversationId,
    onConversationId: setConversationId
  });

  const statusLabel: Record<typeof voice.status, string> = {
    ready: "Ready",
    connecting: "Connecting",
    listening: voice.userSpeaking ? "Hearing you" : "Listening",
    mic_muted: "Mic off",
    thinking: "Thinking",
    speaking: "Speaking",
    interrupted: "Interrupted",
    ended: "Call ended",
    error: "Error",
  };

  const callStateText =
    voice.callActive && voice.status === "mic_muted"
      ? "Call active · microphone off (no audio to assistant)"
      : voice.callActive
        ? "Call in progress"
        : "Ready to call";

  const statusClass = useMemo(
    () =>
      cn(
        "rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        voice.status === "ready" && "border-border text-muted-foreground",
        voice.status === "connecting" && "border-amber-400/40 text-amber-400",
        voice.status === "listening" &&
          (voice.userSpeaking
            ? "border-emerald-300 text-emerald-300 shadow-[0_0_0_2px_rgba(52,211,153,0.18)]"
            : "border-emerald-400/40 text-emerald-400"),
        voice.status === "mic_muted" && "border-amber-500/50 text-amber-400",
        voice.status === "thinking" && "border-sky-400/40 text-sky-400",
        voice.status === "speaking" && "border-primary/50 text-primary",
        voice.status === "interrupted" && "border-orange-400/40 text-orange-300",
        voice.status === "ended" && "border-border text-muted-foreground",
        voice.status === "error" && "border-destructive/50 text-destructive"
      ),
    [voice.status, voice.userSpeaking]
  );

  const liveAssistantBubble = voice.assistantLiveText.trim()
    ? {
        id: "__assistant_live",
        speaker: "assistant" as const,
        text: voice.assistantLiveText.trim(),
        live: true
      }
    : null;

  const liveUserBubble = voice.partialTranscript.trim()
    ? {
        id: "__user_live",
        speaker: "user" as const,
        text: voice.partialTranscript.trim(),
        live: true
      }
    : null;

  const feedItems = [
    ...voice.transcriptEntries.map((entry) => ({ ...entry, live: false as const })),
    ...(liveUserBubble ? [liveUserBubble] : []),
    ...(liveAssistantBubble ? [liveAssistantBubble] : []),
  ];

  useEffect(() => {
    if (!feedRef.current || !stickToBottom) return;
    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [feedItems.length, voice.partialTranscript, voice.assistantLiveText, stickToBottom]);

  function handleFeedScroll() {
    const el = feedRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setStickToBottom(distanceFromBottom < 72);
  }

  return (
    <div className="bg-background flex min-h-0 flex-1 flex-col">
      <div className="border-border/70 bg-background/70 shrink-0 border-b px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight">Voice Session</h3>
            <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
              <ShieldCheck className="text-primary size-3.5" aria-hidden />
              <span>{assistant.name} live session</span>
            </div>
            <div
              role="group"
              aria-label="Voice session mode"
              className="mt-2 flex items-center gap-2"
            >
              <Button
                type="button"
                size="sm"
                variant={mode === "test" ? "default" : "outline"}
                className="h-7 px-2.5"
                onClick={() => setMode("test")}
                disabled={voice.callActive}
                aria-pressed={mode === "test"}
              >
                Test Mode
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "live" ? "default" : "outline"}
                className="h-7 px-2.5"
                onClick={() => setMode("live")}
                disabled={voice.callActive}
                aria-pressed={mode === "live"}
              >
                Live Mode
              </Button>
            </div>
          </div>
          <span
            className={statusClass}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {statusLabel[voice.status]}
          </span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-md border bg-muted/20 px-3 py-2">
            <p className="text-muted-foreground text-[11px]">Assistant</p>
            <p className="text-sm font-semibold">{assistant.name}</p>
          </div>
          <div className="rounded-md border bg-muted/20 px-3 py-2">
            <p className="text-muted-foreground text-[11px]">Mode</p>
            <p className="text-sm font-semibold uppercase">{mode}</p>
          </div>
          <div className="rounded-md border bg-muted/20 px-3 py-2">
            <p className="text-muted-foreground text-[11px]">Mic</p>
            <p className="text-sm font-semibold">
              {voice.micMuted ? "Muted" : voice.userSpeaking ? "Live · speaking" : "Live"}
            </p>
          </div>
        </div>
      </div>

      <div
        ref={feedRef}
        onScroll={handleFeedScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Voice session transcript"
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-gutter:stable] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40"
      >
        {feedItems.length === 0 ? (
          <div className="mx-auto mt-10 w-full max-w-[760px]">
            <p className="text-muted-foreground text-center text-sm">
              {!voice.callActive
                ? "Start the call to begin a live AI voice conversation."
                : voice.status === "mic_muted" || voice.micMuted
                  ? "Microphone is off. Unmute to send your voice to the assistant — otherwise no transcript or reply can be generated."
                  : "Speak naturally. You should see live transcription, then the assistant will think and respond with voice."}
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[760px]">
            <div className="space-y-3">
            {feedItems.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "flex gap-2",
                  entry.speaker === "assistant" ? "flex-row" : "flex-row-reverse"
                )}
              >
                {entry.speaker === "assistant" ? (
                  <div className="bg-primary/10 text-primary mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-border">
                    <Bot className="size-3.5" aria-hidden />
                  </div>
                ) : (
                  <span className="text-muted-foreground mt-2 rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                    You
                  </span>
                )}

                <div
                  className={cn(
                    "max-w-[min(100%,32rem)] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                    entry.speaker === "assistant"
                      ? "bg-card text-card-foreground border border-border"
                      : "bg-primary text-primary-foreground shadow-sm",
                    entry.live && "ring-primary/35 ring-1"
                  )}
                >
                  {entry.speaker === "assistant" ? (
                    <p className="text-muted-foreground mb-1 text-[11px] font-semibold uppercase tracking-wide">
                      {assistant.name || "Assistant"}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap wrap-break-word text-pretty">
                    {entry.text}
                    {entry.live ? (
                      <span className="ml-1 inline-block h-4 w-[2px] animate-pulse bg-current align-text-bottom opacity-70" />
                    ) : null}
                  </p>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        {voice.status === "speaking" ? (
          <div className="bg-card border-border text-muted-foreground mx-auto flex w-full max-w-[760px] items-center gap-2 rounded-lg border px-2.5 py-2 text-xs">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Assistant is speaking, you can interrupt anytime.
          </div>
        ) : null}

        {voice.status === "interrupted" ? (
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-700 dark:text-orange-200">
            Interruption detected. Your voice takes priority now.
          </div>
        ) : null}

        {voice.error ? (
          <div
            role="alert"
            className="mx-auto w-full max-w-[760px] rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            <div className="mb-1 flex items-center gap-1.5">
              <AlertTriangle className="size-3.5" aria-hidden />
              <span className="font-medium">Voice session error</span>
            </div>
            <p>{voice.error}</p>
          </div>
        ) : null}

        {voice.callActive && voice.micMuted ? (
          <div className="mx-auto w-full max-w-[760px] rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <p className="font-medium">Microphone is muted.</p>
            <p className="mt-0.5">
              No audio is sent to speech-to-text while muted, so the assistant cannot hear you or reply.
              Click &quot;Unmute Mic&quot; to resume.
            </p>
          </div>
        ) : null}

        {voice.voiceDebug ? (
          <div className="border-border text-muted-foreground mx-auto mt-3 w-full max-w-[760px] rounded-lg border border-dashed px-3 py-2 font-mono text-[10px] leading-relaxed">
            <p className="text-foreground/80 mb-1 text-[11px] font-sans font-medium">Debug (NEXT_PUBLIC_VOICE_DEBUG)</p>
            <p>WS readyState: {voice.voiceDebug.websocketReadyState ?? "n/a"} · session pipeline: {voice.voiceDebug.sessionPipelineReady ? "yes" : "no"} · mic sends audio: {voice.voiceDebug.micSendsAudio ? "yes" : "no"}</p>
            <p>PCM chunks sent (approx): {voice.voiceDebug.approxAudioChunksSent}</p>
            <p>Last server event: {voice.voiceDebug.lastServerEvent}</p>
          </div>
        ) : null}

      </div>

      <div className="border-border bg-background/95 supports-backdrop-filter:backdrop-blur-sm shrink-0 border-t px-3 pb-4 pt-3">
        <div className="text-muted-foreground mb-2 flex items-center justify-center text-[11px]">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-2 rounded-full",
                voice.callActive && voice.status === "mic_muted"
                  ? "bg-amber-400"
                  : voice.callActive
                    ? "bg-emerald-400"
                    : "bg-muted-foreground"
              )}
            />
            <span>{callStateText}</span>
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[760px] items-center justify-center gap-2">
          {voice.callActive ? (
            <Button
              type="button"
              size="sm"
              variant={voice.micMuted ? "secondary" : "outline"}
              className="h-11 shrink-0 rounded-xl px-4"
              onClick={voice.toggleMic}
            >
              {voice.micMuted ? (
                <MicOff className="size-4" aria-hidden />
              ) : (
                <Mic className="size-4" aria-hidden />
              )}
              {voice.micMuted ? "Unmute Mic" : "Mute Mic"}
            </Button>
          ) : null}

          {voice.callActive && voice.status === "speaking" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-11 shrink-0 rounded-xl px-4"
              onClick={voice.interruptAssistant}
            >
              Interrupt
            </Button>
          ) : null}

          {voice.callActive ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="h-12 min-w-[220px] gap-1.5 rounded-full px-6 text-sm font-medium"
              onClick={voice.stop}
            >
              <PhoneOff className="size-4" aria-hidden />
              End Call
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-12 min-w-[220px] gap-1.5 rounded-full px-6 text-sm font-medium"
              disabled={voice.status === "connecting"}
              onClick={() => void voice.start()}
            >
              {voice.status === "connecting" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Phone className="size-4" aria-hidden />
              )}
              {voice.status === "connecting" ? "Connecting..." : "Call"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

