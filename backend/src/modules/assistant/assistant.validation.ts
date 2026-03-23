import { z } from "zod";

const assistantConfigJson = z.record(z.string(), z.unknown()).optional();

export const createAssistantSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().uuid().optional(),
  config: assistantConfigJson
});

export const updateAssistantSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  projectId: z.string().uuid().optional().nullable(),
  active: z.boolean().optional(),
  config: assistantConfigJson
});

export type CreateAssistantBody = z.infer<typeof createAssistantSchema>;
export type UpdateAssistantBody = z.infer<typeof updateAssistantSchema>;
