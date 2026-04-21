import { apiRequest } from "@/lib/api/client";

export type KnowledgeSource = {
  id: string;
  type: "url" | "text" | "file";
  name: string;
  content?: string;
  enabled: boolean;
  status: "processing" | "ready" | "failed";
  lastUpdatedAt?: string;
};

export type CreateKnowledgeSourceInput = Omit<KnowledgeSource, "status" | "lastUpdatedAt">;
export type UpdateKnowledgeSourceInput = Partial<
  Pick<KnowledgeSource, "type" | "name" | "content" | "enabled">
>;

export async function fetchKnowledgeSources(assistantId: string): Promise<KnowledgeSource[]> {
  const data = await apiRequest<{ sources: KnowledgeSource[] }>(
    `/api/v1/assistants/${encodeURIComponent(assistantId)}/knowledge`,
    { method: "GET" }
  );
  return data.sources ?? [];
}

export async function addKnowledgeSource(
  assistantId: string,
  source: CreateKnowledgeSourceInput
) {
  return apiRequest<unknown>(
    `/api/v1/assistants/${encodeURIComponent(assistantId)}/knowledge`,
    {
      method: "POST",
      body: JSON.stringify(source)
    }
  );
}

export async function updateKnowledgeSource(
  assistantId: string,
  sourceId: string,
  patch: UpdateKnowledgeSourceInput
) {
  return apiRequest<unknown>(
    `/api/v1/assistants/${encodeURIComponent(assistantId)}/knowledge/${encodeURIComponent(sourceId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(patch)
    }
  );
}

export async function refreshKnowledgeSource(assistantId: string, sourceId: string) {
  return apiRequest<unknown>(
    `/api/v1/assistants/${encodeURIComponent(assistantId)}/knowledge/${encodeURIComponent(sourceId)}/refresh`,
    {
      method: "POST"
    }
  );
}

export async function removeKnowledgeSource(assistantId: string, sourceId: string) {
  return apiRequest<unknown>(
    `/api/v1/assistants/${encodeURIComponent(assistantId)}/knowledge/${encodeURIComponent(sourceId)}`,
    {
      method: "DELETE"
    }
  );
}
