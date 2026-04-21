"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { AssistantChatPanel } from "./assistant-chat-panel";
import { AssistantVoicePanel } from "./assistant-voice-panel";
import type { AssistantRecord } from "../types/api-assistant";

export type AssistantDrawerMode = "chat" | "voice";

type AssistantChatDrawerProps = {
  assistant: AssistantRecord | null;
  open: boolean;
  mode?: AssistantDrawerMode;
  onOpenChange: (open: boolean) => void;
};

export function AssistantChatDrawer({
  assistant,
  open,
  mode = "chat",
  onOpenChange,
}: AssistantChatDrawerProps) {
  const [sessionKey, setSessionKey] = useState(0);
  const name = assistant?.name ?? "Assistant";

  function handleOpenChange(next: boolean) {
    if (next) setSessionKey((k) => k + 1);
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex h-dvh max-h-dvh flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        {mode === "chat" ? (
          <SheetHeader className="border-border shrink-0 border-b px-4 py-3">
            <SheetTitle>Chat · {name}</SheetTitle>
            <SheetDescription>
              Powered by AI SDK{" "}
              <span className="text-foreground/80 font-mono">useChat</span>.
            </SheetDescription>
          </SheetHeader>
        ) : null}
        {assistant && mode === "chat" ? (
          <AssistantChatPanel
            key={`${assistant.id}-${sessionKey}`}
            assistant={assistant}
          />
        ) : null}
        {assistant && mode === "voice" ? (
          <AssistantVoicePanel
            key={`${assistant.id}-${sessionKey}-voice`}
            assistant={assistant}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
