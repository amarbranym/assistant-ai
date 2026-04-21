"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAssistantConversations, fetchConversationTranscript } from "../api/conversations.api";

export const conversationQueryKeys = {
  all: ["conversations"] as const,
  list: (assistantId: string) => [...conversationQueryKeys.all, "list", assistantId] as const,
  transcript: (assistantId: string, conversationId: string) =>
    [...conversationQueryKeys.all, "transcript", assistantId, conversationId] as const,
};

export function useAssistantConversationsQuery(assistantId: string, limit = 20) {
  return useQuery({
    queryKey: [...conversationQueryKeys.list(assistantId), limit] as const,
    queryFn: () => fetchAssistantConversations(assistantId, limit),
  });
}

export function useConversationTranscriptQuery(assistantId: string, conversationId?: string) {
  return useQuery({
    queryKey: conversationId
      ? conversationQueryKeys.transcript(assistantId, conversationId)
      : ["conversations", "transcript", "disabled"],
    queryFn: () => fetchConversationTranscript(assistantId, conversationId as string),
    enabled: Boolean(conversationId),
  });
}

