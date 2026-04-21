import Link from "next/link";

import { AssistantChatView } from "@/features/assistant/components/assistant-chat-view";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AssistantChatPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="border-border bg-background flex min-h-0 flex-1 flex-col border-b px-5 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-[0.65rem] uppercase tracking-widest">
            Chat
          </p>
          <h1 className="text-foreground mt-1 text-lg font-semibold">
            Conversation
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            Test your assistant with live streaming responses before publishing.
          </p>
        </div>
        <Link
          href="/assistants"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Back to assistants
        </Link>
      </div>
      <AssistantChatView assistantId={id} />
    </div>
  );
}
