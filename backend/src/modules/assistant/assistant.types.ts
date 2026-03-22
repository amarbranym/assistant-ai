import type { AssistantConfig, AssistantConfigUpdate } from "../ai";

export interface CreateAssistantDTO {
  name: string;
  description?: string;
  projectId?: string;
  config?: AssistantConfig;
}

export interface UpdateAssistantDTO {
  name?: string;
  description?: string;
  projectId?: string | null;
  active?: boolean;
  config?: AssistantConfigUpdate;
}
