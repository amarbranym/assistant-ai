import type { Assistant, Message, Role } from "@prisma/client";
import type { Tool, ModelMessage } from "ai";

import { AppError } from "../../../common/errors/AppError";
import { getPrismaClient } from "../../../lib/prismaClient";
import { resolveAssistantRuntimeTools } from "../../assistant/tooling/resolve-runtime-tools";
import {
  resolveLlmConfigFromAssistantConfig,
  streamTextResponseSafe
} from "../../llm/llm.service";
import {
  findConflictingNames,
  inferIntentShiftNote,
  inferKnownContext,
  planNextQuestion
} from "../../llm/conversation-prompt-signals";
import { buildLayeredSystemPrompt } from "../../llm/prompt.builder";

const prisma = getPrismaClient();

type KnowledgeSource = {
  id: string;
  type: "url" | "text" | "file";
  name: string;
  content?: string;
  enabled: boolean;
  status: "processing" | "ready" | "failed";
};

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
    // Do not silently create a new conversation if the client intended continuity.
    throw new AppError(404, "Conversation not found", "CONVERSATION_NOT_FOUND");
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
  mode?: "test" | "live";
  channel?: "chat" | "voice";
}) {
  if (input.mode === "live" && !input.assistant.active) {
    throw new AppError(403, "Assistant is inactive. Enable it before using live mode.", "ASSISTANT_INACTIVE");
  }

  const history = await getConversationHistory(input.conversationId, 20);

  const assistantConfig = (input.assistant.config ?? {}) as Record<string, unknown>;
  const mode = input.mode === "live" ? "live" : "test";
  const channel = input.channel ?? "chat";
  const { tools: runtimeTools, manifest: toolManifest } = resolveAssistantRuntimeTools(
    input.assistant,
    {
      assistantConfig,
      conversationId: input.conversationId,
      mode,
      extraTools: input.tools
    }
  );
  const baseConfig = resolveLlmConfigFromAssistantConfig(assistantConfig, {
    tools: runtimeTools
  });
  // Voice runtime should respond like a live call, not an essay.
  const config =
    channel === "voice"
      ? {
          ...baseConfig,
          maxOutputTokens: Math.min(baseConfig.maxOutputTokens, 240),
          temperature: Math.min(baseConfig.temperature, 0.65)
        }
      : baseConfig;
  const knowledgeSources = readKnowledgeSources(assistantConfig).filter(
    (s) => s.enabled && s.status === "ready" && s.content?.trim()
  );
  const knowledgeContext =
    knowledgeSources.length > 0
      ? knowledgeSources
          .slice(0, 8)
          .map((s) => `- ${s.name}: ${(s.content ?? "").slice(0, 600)}`)
          .join("\n")
      : undefined;

  const hasPriorAssistantTurn = history.some((m) => m.role === "assistant");
  const recentUserText = [
    ...history.filter((m) => m.role === "user").map((m) => m.content),
    input.userText
  ]
    .filter((s) => typeof s === "string" && s.trim().length > 0)
    .slice(-10)
    .join("\n");

  const knownContext = inferKnownContext(recentUserText);
  const priorAssistantText = history
    .filter((m) => m.role === "assistant")
    .map((m) => m.content)
    .join("\n");
  const conflictingNames = findConflictingNames({
    assistantName: input.assistant.name,
    text: `${config.systemPrompt}\n${priorAssistantText}`
  });

  const intentShiftNote = inferIntentShiftNote(history, input.userText);
  const plannedNextQuestion = planNextQuestion(knownContext, input.userText);
  const bannedPhrases = hasPriorAssistantTurn
    ? [
        "Thank you for calling",
        "This is",
        `This is ${input.assistant.name}`,
        `This is ${input.assistant.name},`,
        "How can I help you today",
        "How may I help you today",
        ...conflictingNames.map((n) => `This is ${n}`),
        ...conflictingNames
      ]
    : [];

  const runtimeSystemPrompt = buildLayeredSystemPrompt({
    assistantName: input.assistant.name,
    assistantDescription: input.assistant.description ?? null,
    userSystemPrompt: config.systemPrompt,
    knowledgeContext,
    channel,
    hasPriorAssistantTurn,
    knownContext,
    bannedPhrases,
    plannedNextQuestion,
    intentShiftNote,
    conflictingNames,
    runtimeMode: mode,
    enabledToolsManifest: toolManifest
  });

  const messages: ModelMessage[] = [
    {
      role: "system",
      content: runtimeSystemPrompt
    },
    ...toModelMessages(history),
    { role: "user", content: input.userText }
  ];

  await saveUserMessage(input.conversationId, input.userText);

  if (knowledgeSources.length > 0) {
    incrementKnowledgeUsage(input.assistant, knowledgeSources.length).catch(() => {});
  }

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

function readKnowledgeSources(config: Record<string, unknown>): KnowledgeSource[] {
  const knowledge =
    config.knowledge && typeof config.knowledge === "object"
      ? (config.knowledge as Record<string, unknown>)
      : {};
  const sources = Array.isArray(knowledge.sources) ? knowledge.sources : [];
  return sources
    .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === "object"))
    .map((s) => ({
      id: typeof s.id === "string" ? s.id : "",
      type: s.type === "url" || s.type === "text" || s.type === "file" ? s.type : "text",
      name: typeof s.name === "string" ? s.name : "Untitled",
      content: typeof s.content === "string" ? s.content : undefined,
      enabled: typeof s.enabled === "boolean" ? s.enabled : true,
      status:
        s.status === "processing" || s.status === "ready" || s.status === "failed"
          ? s.status
          : "ready"
    }));
}

async function incrementKnowledgeUsage(assistant: Assistant, sourceCount: number) {
  const config = (assistant.config ?? {}) as Record<string, unknown>;
  const analytics =
    config.analytics && typeof config.analytics === "object"
      ? (config.analytics as Record<string, unknown>)
      : {};
  const knowledge =
    analytics.knowledge && typeof analytics.knowledge === "object"
      ? (analytics.knowledge as Record<string, unknown>)
      : {};
  const totalHits = typeof knowledge.totalHits === "number" ? knowledge.totalHits : 0;
  const lastSourceCountUsed =
    typeof knowledge.lastSourceCountUsed === "number" ? knowledge.lastSourceCountUsed : 0;
  await prisma.assistant.update({
    where: { id: assistant.id },
    data: {
      config: {
        ...config,
        analytics: {
          ...analytics,
          knowledge: {
            ...knowledge,
            totalHits: totalHits + 1,
            lastSourceCountUsed: sourceCount || lastSourceCountUsed,
            lastUsedAt: new Date().toISOString()
          }
        }
      }
    }
  });
}

export function extractUserTextFromBody(body: {
  input?: string;
  messages?: unknown;
}): string | undefined {
  return (body.input && body.input.trim()) || extractLastUserTextFromUiMessages(body.messages);
}

