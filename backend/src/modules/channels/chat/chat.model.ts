import { z } from "zod";

export const chatStreamSchema = z.object({
  assistantId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  input: z.string().min(1).max(8000).optional(),
  /**
   * Optional UI protocol payload (e.g. Vercel AI SDK useChat).
   * We only use this to extract the last user text if `input` is omitted.
   */
  messages: z.unknown().optional(),
  /**
   * Optional metadata container (e.g. `useChat({ body: { ... } })` patterns).
   * If present, `assistantId` and `conversationId` can also be provided here.
   */
  data: z.unknown().optional()
}).passthrough();

export type ChatStreamBody = z.infer<typeof chatStreamSchema>;

export type ChatStreamResult = {
  conversationId: string;
};

