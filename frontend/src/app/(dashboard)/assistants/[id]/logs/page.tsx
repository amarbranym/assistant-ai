import Link from "next/link";

import { AssistantLogsView } from "@/features/logs/views/assistant-logs-view";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AssistantLogsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="border-border bg-background flex min-h-0 flex-1 flex-col border-b">
      <div className="px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[0.65rem] uppercase tracking-widest">
              Logs
            </p>
            <h1 className="text-foreground mt-1 text-lg font-semibold">
              Conversations
            </h1>
          </div>
          <Link
            href="/assistants"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to assistants
          </Link>
        </div>
      </div>
      <AssistantLogsView assistantId={id} />
    </div>
  );
}

