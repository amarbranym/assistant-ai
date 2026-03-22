import { z } from "zod";

// Accept both historical and new naming for the provider.
const voiceProviderSchema = z.enum(["11labs", "elevenlabs", "openai", "azure", "custom"]);

const llmProviderSchema = z.enum(["openai", "anthropic", "google", "custom"]);

const messageRoleSchema = z.enum(["system", "user", "assistant", "tool", "developer"]);

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

/**
 * Current assistant config shape used by the app UI/runtime.
 * Stored as JSON in Prisma `assistant.config`.
 */
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

// For PATCH-like updates where only a subset of config is provided.
export const assistantConfigUpdateSchema = assistantConfigSchema.partial();

export type AssistantConfig = z.infer<typeof assistantConfigSchema>;
export type AssistantConfigUpdate = z.infer<typeof assistantConfigUpdateSchema>;

