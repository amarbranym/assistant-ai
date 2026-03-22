import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
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
          <p className="text-muted-foreground font-mono text-[0.65rem] uppercase tracking-widest">
            Voice
          </p>
          <h1 className="font-heading text-foreground mt-1 text-lg font-semibold">
            Talk with assistant
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            Placeholder — wire WebRTC / telephony here. Assistant id:{" "}
            <code className="text-foreground font-mono text-xs">{id}</code>
          </p>
        </div>
        <Link
          href="/assistants"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Back to assistants
        </Link>
      </div>
      <div className="border-border bg-muted/20 text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-sm">
        <p>Voice session UI will appear here.</p>
      </div>
    </div>
  );
}
