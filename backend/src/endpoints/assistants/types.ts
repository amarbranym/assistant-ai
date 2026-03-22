import { z } from "zod";
import type { ValidatedRequest } from "../../shared/types/common.types";
import { assistantConfigSchema } from "../../modules/ai";

export const createAssistantSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().uuid().optional(),
  config: assistantConfigSchema.optional()
});

export type CreateAssistantBody = z.infer<typeof createAssistantSchema>;

export type ListAssistantsRequest = ValidatedRequest<never> & {
  query?: { projectId?: string; activeOnly?: string };
};

export type CreateAssistantRequest = ValidatedRequest<CreateAssistantBody>;

