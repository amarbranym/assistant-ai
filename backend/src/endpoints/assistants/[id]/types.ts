import { z } from "zod";
import type { ValidatedRequest } from "../../../shared/types/common.types";
import { assistantConfigUpdateSchema } from "../../../modules/ai";

export const updateAssistantSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  projectId: z.string().uuid().optional().nullable(),
  active: z.boolean().optional(),
  config: assistantConfigUpdateSchema.optional()
});

export type UpdateAssistantBody = z.infer<typeof updateAssistantSchema>;

export type GetAssistantRequest = ValidatedRequest<never>;

export type UpdateAssistantRequest = ValidatedRequest<UpdateAssistantBody>;

export type DeleteAssistantRequest = ValidatedRequest<never>;

