"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Loader2, MessageSquareText, Wrench } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAssistantAnalyticsQuery } from "@/features/analytics/hooks/use-analytics";

import { useAssistantConversationsQuery, useConversationTranscriptQuery } from "../hooks/use-conversations";

export function AssistantLogsView({ assistantId }: { assistantId: string }) {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const list = useAssistantConversationsQuery(assistantId, 30);
  const transcript = useConversationTranscriptQuery(assistantId, selectedId);
  const assistantAnalytics = useAssistantAnalyticsQuery(assistantId);

  const items = list.data?.conversations ?? [];
  const selected = transcript.data ?? null;

  const empty = !list.isPending && items.length === 0;
  const selectedLabel = useMemo(() => {
    if (!selected) return "Select a conversation";
    return `Conversation · ${new Date(selected.createdAt).toLocaleString()}`;
  }, [selected]);

  function parseToolEvent(raw: string): null | {
    tool: string;
    status: string;
    mode?: string;
    url?: string;
    missing?: string[];
    httpStatus?: number;
  } {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed.type !== "tool.event") return null;
      return {
        tool: typeof parsed.tool === "string" ? parsed.tool : "tool",
        status: typeof parsed.status === "string" ? parsed.status : "event",
        mode: typeof parsed.mode === "string" ? parsed.mode : undefined,
        url: typeof parsed.url === "string" ? parsed.url : undefined,
        missing: Array.isArray(parsed.missing)
          ? parsed.missing.filter((x): x is string => typeof x === "string")
          : undefined,
        httpStatus: typeof parsed.httpStatus === "number" ? parsed.httpStatus : undefined
      };
    } catch {
      return null;
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <DashboardPageHeader
        title="Logs"
        description="Review conversations, transcripts, and assistant behavior."
        actions={
          <Link
            href={`/assistants/${assistantId}/chat`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Open test chat
          </Link>
        }
      />

      <div className="min-h-0 flex-1 px-5 py-6 sm:px-6">
        <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-border/80 shadow-theme">
            <CardContent className="py-4">
              <p className="text-muted-foreground text-xs">Conversations</p>
              <p className="text-xl font-semibold">
                {(assistantAnalytics.data?.conversationsCount ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-theme">
            <CardContent className="py-4">
              <p className="text-muted-foreground text-xs">Messages</p>
              <p className="text-xl font-semibold">
                {(assistantAnalytics.data?.messagesCount ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-theme">
            <CardContent className="py-4">
              <p className="text-muted-foreground text-xs">Calls</p>
              <p className="text-xl font-semibold">
                {(assistantAnalytics.data?.callsCount ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-theme">
            <CardContent className="py-4">
              <p className="text-muted-foreground text-xs">Knowledge hits</p>
              <p className="text-xl font-semibold">
                {(assistantAnalytics.data?.knowledge.totalHits ?? 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid min-h-0 gap-3 lg:grid-cols-[22rem_1fr]">
          <Card className="border-border/80 shadow-theme min-h-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0">
              {list.isPending ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  Loading…
                </div>
              ) : empty ? (
                <p className="text-muted-foreground text-sm">No conversations yet.</p>
              ) : (
                <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                  {items.map((c) => {
                    const active = c.id === selectedId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        className={cn(
                          "w-full rounded-lg border px-3 py-2 text-left transition",
                          active
                            ? "border-primary/40 bg-primary/5"
                            : "border-border hover:border-primary/25 hover:bg-muted/25"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">
                            {new Date(c.createdAt).toLocaleString()}
                          </p>
                          <span className="text-muted-foreground text-xs">
                            {c.messageCount} msg
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5 text-xs truncate">
                          {c.id}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-theme min-h-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">{selectedLabel}</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0">
              {!selectedId ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <MessageSquareText className="size-4" aria-hidden />
                  Select a conversation on the left to view transcript.
                </div>
              ) : transcript.isPending ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  Loading transcript…
                </div>
              ) : transcript.isError ? (
                <div className="space-y-2">
                  <p className="text-destructive text-sm">
                    {transcript.error instanceof Error
                      ? transcript.error.message
                      : "Failed to load transcript."}
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={() => void transcript.refetch()}>
                    Retry
                  </Button>
                </div>
              ) : !selected ? (
                <p className="text-muted-foreground text-sm">No transcript available.</p>
              ) : (
                <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                  {selected.messages.map((m) => {
                    const toolEvent = m.role === "system" ? parseToolEvent(m.content) : null;
                    if (toolEvent) {
                      return (
                        <div key={m.id} className="rounded-lg border bg-amber-50/30 px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="gap-1">
                              <Wrench className="size-3" />
                              Tool event
                            </Badge>
                            <Badge variant="outline">{toolEvent.tool}</Badge>
                            <Badge variant="outline">{toolEvent.status}</Badge>
                            {toolEvent.mode ? <Badge variant="outline">{toolEvent.mode}</Badge> : null}
                            {typeof toolEvent.httpStatus === "number" ? (
                              <Badge variant="outline">HTTP {toolEvent.httpStatus}</Badge>
                            ) : null}
                          </div>
                          {toolEvent.missing && toolEvent.missing.length > 0 ? (
                            <p className="text-muted-foreground mt-1 text-xs">
                              Missing fields: {toolEvent.missing.join(", ")}
                            </p>
                          ) : null}
                          {toolEvent.url ? (
                            <p className="text-muted-foreground mt-1 truncate text-xs">
                              Endpoint: {toolEvent.url}
                            </p>
                          ) : null}
                          <p className="text-muted-foreground mt-1 text-[11px]">
                            {new Date(m.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div key={m.id} className="rounded-lg border bg-card px-3 py-2">
                        <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">
                          {m.role} · {new Date(m.createdAt).toLocaleTimeString()}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

