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
import type { AssistantRecord } from "../types/api-assistant";

type AssistantChatDrawerProps = {
  assistant: AssistantRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AssistantChatDrawer({
  assistant,
  open,
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
      <SheetContent className="flex h-full max-h-dvh flex-col gap-0 p-0">
        <SheetHeader className="border-border shrink-0 border-b px-4 py-3">
          <SheetTitle>Chat · {name}</SheetTitle>
          <SheetDescription>
            Powered by AI SDK{" "}
            <span className="text-foreground/80 font-mono">useChat</span> with a
            simulated stream (no backend yet).
          </SheetDescription>
        </SheetHeader>
        {assistant ? (
          <AssistantChatPanel
            key={`${assistant.id}-${sessionKey}`}
            assistant={assistant}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
