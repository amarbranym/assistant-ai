import Link from "next/link";

import { AssistantTalkView } from "@/features/assistant/components/assistant-talk-view";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AssistantTalkPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="border-border bg-background flex min-h-0 flex-1 flex-col border-b px-5 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-[0.65rem] uppercase tracking-widest">
            Voice Test
          </p>
          <h1 className="text-foreground mt-1 text-lg font-semibold">
            Talk with assistant
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            Run a live microphone conversation with barge-in and transcript playback.
          </p>
        </div>
        <Link
          href="/assistants"
          className={cn(
            "border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors"
          )}
        >
          Back to assistants
        </Link>
      </div>
      <AssistantTalkView assistantId={id} />
    </div>
  );
}
