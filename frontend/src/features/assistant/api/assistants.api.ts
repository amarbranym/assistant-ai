import { apiRequest } from "@/lib/api/client";
import type {
  AssistantRecord,
  CreateAssistantPayload,
  UpdateAssistantPayload,
} from "../types/api-assistant";

const ASSISTANTS_PATH = "/api/v1/assistants";

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.length > 0) return value;
  return new Date(0).toISOString();
}

function mapAssistantRow(row: unknown): AssistantRecord {
  const r = row as Record<string, unknown>;
  return {
    id: String(r.id),
    name: String(r.name),
    description:
      r.description === null || r.description === undefined
        ? null
        : String(r.description),
    projectId:
      r.projectId === null || r.projectId === undefined
        ? null
        : String(r.projectId),
    config: r.config ?? {},
    active: Boolean(r.active),
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
  };
}

export async function fetchAssistants(): Promise<AssistantRecord[]> {
  const data = await apiRequest<unknown[]>(ASSISTANTS_PATH, { method: "GET" });
  return data.map(mapAssistantRow);
}

export async function fetchAssistant(id: string): Promise<AssistantRecord> {
  const row = await apiRequest<unknown>(
    `${ASSISTANTS_PATH}/${encodeURIComponent(id)}`,
    { method: "GET" }
  );
  return mapAssistantRow(row);
}

export async function createAssistant(
  input: CreateAssistantPayload
): Promise<AssistantRecord> {
  const row = await apiRequest<unknown>(ASSISTANTS_PATH, {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      projectId: input.projectId,
      config: input.config,
    }),
  });
  return mapAssistantRow(row);
}

export async function updateAssistant(
  id: string,
  input: UpdateAssistantPayload
): Promise<AssistantRecord> {
  const row = await apiRequest<unknown>(
    `${ASSISTANTS_PATH}/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        name: input.name,
        description: input.description,
        projectId: input.projectId,
        active: input.active,
        config: input.config,
      }),
    }
  );
  return mapAssistantRow(row);
}

export async function deleteAssistant(id: string): Promise<void> {
  await apiRequest<null>(`${ASSISTANTS_PATH}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
