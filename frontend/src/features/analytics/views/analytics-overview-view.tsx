"use client";

import { BarChart3, Bot, MessageSquareText, PhoneCall, Sparkles } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useAnalyticsOverviewQuery } from "../hooks/use-analytics";

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: typeof Bot;
}) {
  return (
    <Card className="border-border/80 shadow-theme">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <Icon className="text-muted-foreground size-4" aria-hidden />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

export function AnalyticsOverviewView() {
  const { data, isPending, isError, error, refetch } = useAnalyticsOverviewQuery();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <DashboardPageHeader
        title="Analytics"
        description="Usage and performance signals across assistants."
      />

      <div className="w-full flex-1 px-5 py-6 sm:px-6">
        {isPending ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <BarChart3 className="size-4" aria-hidden />
            Loading analytics…
          </div>
        ) : isError || !data ? (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive text-base">Couldn’t load analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-destructive text-sm">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
              <button
                type="button"
                className="border-border bg-background hover:bg-muted rounded-md border px-3 py-2 text-sm"
                onClick={() => void refetch()}
              >
                Retry
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard title="Assistants" value={data.assistantsCount} icon={Bot} />
            <StatCard title="Conversations" value={data.conversationsCount} icon={MessageSquareText} />
            <StatCard title="Messages" value={data.messagesCount} icon={MessageSquareText} />
            <StatCard title="Calls" value={data.callsCount} icon={PhoneCall} />
            <StatCard title="Knowledge hits" value={data.knowledgeHitsTotal} icon={Sparkles} />
          </div>
        )}
      </div>
    </div>
  );
}

