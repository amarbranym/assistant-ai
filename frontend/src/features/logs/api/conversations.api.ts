import { apiRequest } from "@/lib/api/client";

export type ConversationListItem = {
  id: string;
  createdAt: string;
  messageCount: number;
};

export type ConversationTranscript = {
  id: string;
  createdAt: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: string;
  }>;
};

export async function fetchAssistantConversations(assistantId: string, limit = 20) {
  return apiRequest<{ conversations: ConversationListItem[] }>(
    `/api/v1/assistants/${encodeURIComponent(assistantId)}/conversations?limit=${encodeURIComponent(String(limit))}`,
    { method: "GET" }
  );
}

export async function fetchConversationTranscript(assistantId: string, conversationId: string) {
  return apiRequest<ConversationTranscript>(
    `/api/v1/assistants/${encodeURIComponent(assistantId)}/conversations/${encodeURIComponent(conversationId)}`,
    { method: "GET" }
  );
}

