import { apiRequest } from "@/lib/api/client";

export type AnalyticsOverview = {
  assistantsCount: number;
  conversationsCount: number;
  messagesCount: number;
  callsCount: number;
  knowledgeHitsTotal: number;
};

export type AssistantAnalytics = {
  assistant: {
    id: string;
    name: string;
  };
  conversationsCount: number;
  messagesCount: number;
  callsCount: number;
  knowledge: {
    totalHits: number;
    lastSourceCountUsed: number;
    lastUsedAt: string | null;
  };
};

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  return apiRequest<AnalyticsOverview>("/api/v1/analytics/overview", { method: "GET" });
}

export async function fetchAssistantAnalytics(assistantId: string): Promise<AssistantAnalytics> {
  return apiRequest<AssistantAnalytics>(`/api/v1/analytics/assistants/${encodeURIComponent(assistantId)}`, {
    method: "GET"
  });
}

