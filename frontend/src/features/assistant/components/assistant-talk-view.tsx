"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useAssistantQuery } from "@/features/assistant/hooks/use-assistants";
import { cn } from "@/lib/utils";

import { AssistantVoicePanel } from "./assistant-voice-panel";

type AssistantTalkViewProps = {
  assistantId: string;
};

export function AssistantTalkView({ assistantId }: AssistantTalkViewProps) {
  const { data, isPending, isError, error, refetch } = useAssistantQuery(assistantId);

  if (isPending) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-border bg-background/80 mb-4 flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider">Voice Test</p>
            <h1 className="text-lg font-semibold">Loading assistant...</h1>
          </div>
          <Link href="/assistants" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Back to assistants
          </Link>
        </div>
        <div className="text-muted-foreground bg-muted/30 flex min-h-[260px] items-center justify-center rounded-lg border border-dashed">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Preparing voice session UI...
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm">
          Failed to load assistant: {error instanceof Error ? error.message : "Unknown error"}
        </div>
        <div className="mt-3 flex gap-2">
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

  return <AssistantVoicePanel assistant={data} />;
}
