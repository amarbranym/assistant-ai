import type { Assistant, Message, Role } from "@prisma/client";
import type { Tool, ModelMessage } from "ai";

import { AppError } from "../../../common/errors/AppError";
import { getPrismaClient } from "../../../lib/prismaClient";
import {
  resolveLlmConfigFromAssistantConfig,
  streamTextResponseSafe
} from "../../llm/llm.service";

const prisma = getPrismaClient();

function asTextContent(content: unknown): string | undefined {
  return typeof content === "string" ? content : undefined;
}

function extractLastUserTextFromUiMessages(messages: unknown): string | undefined {
  if (!Array.isArray(messages)) return undefined;

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i] as { role?: unknown; content?: unknown; parts?: unknown };
    if (!m || typeof m !== "object") continue;
    if (m.role !== "user") continue;

    const fromContent = asTextContent(m.content);
    if (fromContent && fromContent.trim()) return fromContent;

    if (Array.isArray(m.parts)) {
      const text = (m.parts as unknown[])
        .map((p) => p as { type?: unknown; text?: unknown })
        .filter((p) => p && p.type === "text" && typeof p.text === "string")
        .map((p) => p.text)
        .join("");
      if (text.trim()) return text;
    }
  }

  return undefined;
}

export async function getAssistantForUser(assistantId: string, userId: string) {
  const assistant = await prisma.assistant.findFirst({
    where: { id: assistantId, userId }
  });
  if (!assistant) {
    throw new AppError(404, "Assistant not found", "NOT_FOUND");
  }
  return assistant;
}

export async function getOrCreateConversation(input: {
  assistantId: string;
  conversationId?: string;
}) {
  if (input.conversationId) {
    const existing = await prisma.conversation.findFirst({
      where: { id: input.conversationId, assistantId: input.assistantId }
    });
    if (existing) return existing;
  }

  return prisma.conversation.create({
    data: { assistantId: input.assistantId }
  });
}

export async function getConversationHistory(conversationId: string, limit = 20) {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit
  });
  return rows.reverse();
}

function toModelMessages(history: Message[]): ModelMessage[] {
  return history.map((m) => ({
    role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
    content: m.content
  }));
}

export async function saveUserMessage(conversationId: string, content: string) {
  await prisma.message.create({
    data: {
      conversationId,
      role: "user" satisfies Role,
      content
    }
  });
}

export async function saveAssistantMessage(conversationId: string, content: string) {
  await prisma.message.create({
    data: {
      conversationId,
      role: "assistant" satisfies Role,
      content
    }
  });
}

export async function streamAssistantReply(input: {
  assistant: Assistant;
  conversationId: string;
  userText: string;
  abortSignal?: AbortSignal;
  tools?: Record<string, Tool>;
}) {
  const history = await getConversationHistory(input.conversationId, 20);

  const config = resolveLlmConfigFromAssistantConfig(input.assistant.config, {
    tools: input.tools
  });

  const hasPriorAssistantTurn = history.some((m) => m.role === "assistant");
  const antiRepetition =
    hasPriorAssistantTurn
      ? "Do not repeat your greeting, brand intro, or self-identification on every message. You have already introduced yourself earlier in this conversation. Continue naturally and only ask the minimum necessary questions."
      : undefined;

  const messages: ModelMessage[] = [
    {
      role: "system",
      content: antiRepetition
        ? `${config.systemPrompt}\n\n${antiRepetition}`
        : config.systemPrompt
    },
    ...toModelMessages(history),
    { role: "user", content: input.userText }
  ];

  await saveUserMessage(input.conversationId, input.userText);

  let didPersistAssistant = false;

  const result = await streamTextResponseSafe({
    config,
    messages,
    abortSignal: input.abortSignal,
    onFinish: async ({ text }) => {
      if (didPersistAssistant) return;
      didPersistAssistant = true;
      if (input.abortSignal?.aborted) return;
      if (!text || !text.trim()) return;
      await saveAssistantMessage(input.conversationId, text);
    }
  });

  return { result };
}

export function extractUserTextFromBody(body: {
  input?: string;
  messages?: unknown;
}): string | undefined {
  return (body.input && body.input.trim()) || extractLastUserTextFromUiMessages(body.messages);
}

