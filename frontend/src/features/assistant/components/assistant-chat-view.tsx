"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useAssistantQuery } from "@/features/assistant/hooks/use-assistants";
import { cn } from "@/lib/utils";

import { AssistantChatPanel } from "./assistant-chat-panel";

type AssistantChatViewProps = {
  assistantId: string;
};

export function AssistantChatView({ assistantId }: AssistantChatViewProps) {
  const { data, isPending, isError, error, refetch } = useAssistantQuery(assistantId);

  if (isPending) {
    return (
      <div className="text-muted-foreground bg-muted/30 flex min-h-[260px] items-center justify-center rounded-lg border border-dashed">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading conversation...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[260px] flex-col items-start justify-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
        <p className="text-destructive text-sm">
          Failed to load assistant: {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Retry
          </button>
          <Link href="/assistants" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            Back to assistants
          </Link>
        </div>
      </div>
    );
  }

  return <AssistantChatPanel assistant={data} />;
}
