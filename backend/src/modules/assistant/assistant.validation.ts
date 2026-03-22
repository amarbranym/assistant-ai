import { z } from "zod";

const voiceProviderSchema = z.enum([
  "11labs",
  "elevenlabs",
  "openai",
  "azure",
  "custom"
]);

const llmProviderSchema = z.enum(["openai", "anthropic", "google", "custom"]);

const messageRoleSchema = z.enum([
  "system",
  "user",
  "assistant",
  "tool",
  "developer"
]);

const assistantModelMessageSchema = z.object({
  role: messageRoleSchema,
  content: z.string()
});

const voiceSchema = z.object({
  model: z.string().min(1),
  voiceId: z.string().min(1),
  provider: voiceProviderSchema,
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional()
});

const modelSchema = z.object({
  model: z.string().min(1),
  provider: llmProviderSchema,
  temperature: z.number().min(0).max(2).optional(),
  messages: z.array(assistantModelMessageSchema).default([])
});

export const assistantConfigSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  voice: voiceSchema,
  model: modelSchema,
  firstMessage: z.string().min(1),
  voicemailMessage: z.string().min(1).optional(),
  endCallMessage: z.string().min(1).optional(),
  endCallPhrases: z.array(z.string().min(1)).default([]),
  hipaaEnabled: z.boolean().default(false),
  backgroundDenoisingEnabled: z.boolean().default(false),
  tools: z.array(z.string()).default([])
});

export const assistantConfigUpdateSchema = assistantConfigSchema.partial();

export type AssistantConfig = z.infer<typeof assistantConfigSchema>;
export type AssistantConfigUpdate = z.infer<typeof assistantConfigUpdateSchema>;

export const createAssistantSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().uuid().optional(),
  config: assistantConfigSchema.optional()
});

export const updateAssistantSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  projectId: z.string().uuid().optional().nullable(),
  active: z.boolean().optional(),
  config: assistantConfigUpdateSchema.optional()
});

export type CreateAssistantBody = z.infer<typeof createAssistantSchema>;
export type UpdateAssistantBody = z.infer<typeof updateAssistantSchema>;
