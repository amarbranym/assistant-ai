"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAnalyticsOverview, fetchAssistantAnalytics } from "../api/analytics.api";

export const analyticsQueryKeys = {
  all: ["analytics"] as const,
  overview: () => [...analyticsQueryKeys.all, "overview"] as const,
  assistant: (assistantId: string) => [...analyticsQueryKeys.all, "assistant", assistantId] as const
};

export function useAnalyticsOverviewQuery() {
  return useQuery({
    queryKey: analyticsQueryKeys.overview(),
    queryFn: fetchAnalyticsOverview
  });
}

export function useAssistantAnalyticsQuery(assistantId: string) {
  return useQuery({
    queryKey: analyticsQueryKeys.assistant(assistantId),
    queryFn: () => fetchAssistantAnalytics(assistantId)
  });
}

