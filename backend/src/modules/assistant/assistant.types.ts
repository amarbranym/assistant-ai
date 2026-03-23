export interface CreateAssistantDTO {
  name: string;
  description?: string;
  projectId?: string;
  config?: Record<string, unknown>;
}

export interface UpdateAssistantDTO {
  name?: string;
  description?: string;
  projectId?: string | null;
  active?: boolean;
  config?: Record<string, unknown>;
}
