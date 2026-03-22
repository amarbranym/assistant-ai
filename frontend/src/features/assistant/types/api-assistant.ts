/**
 * Assistant row returned by `GET /api/v1/assistants` (Prisma JSON + fields).
 */
export type AssistantRecord = {
  id: string;
  name: string;
  description: string | null;
  projectId: string | null;
  config: unknown;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAssistantPayload = {
  name: string;
  description?: string;
  projectId?: string;
  config?: unknown;
};

export type UpdateAssistantPayload = {
  name?: string;
  description?: string;
  projectId?: string | null;
  active?: boolean;
  config?: unknown;
};
