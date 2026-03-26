import type { Assistant, Message, Role } from "@prisma/client";
import type { Tool, ModelMessage } from "ai";

import { AppError } from "../../../common/errors/AppError";
import { getPrismaClient } from "../../../lib/prismaClient";
import {
  resolveLlmConfigFromAssistantConfig,
  streamTextResponseSafe
} from "../../llm/llm.service";
import { buildRuntimeSystemPrompt } from "../../llm/prompt.builder";

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
}) {
  const history = await getConversationHistory(input.conversationId, 20);

  const config = resolveLlmConfigFromAssistantConfig(input.assistant.config, {
    tools: input.tools
  });

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
        ...conflictingNames.map((n) => `This is ${n}`),
        ...conflictingNames
      ]
    : [];

  const runtimeSystemPrompt = buildRuntimeSystemPrompt({
    assistantName: input.assistant.name,
    assistantDescription: input.assistant.description ?? null,
    baseSystemPrompt: config.systemPrompt,
    channel: "chat",
    hasPriorAssistantTurn,
    knownContext,
    bannedPhrases,
    plannedNextQuestion,
    intentShiftNote,
    conflictingNames
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

function inferKnownContext(allUserText: string): Record<string, string | boolean> {
  const t = allUserText.toLowerCase();
  const ctx: Record<string, string | boolean> = {};

  if (/\b(book|schedule|appointment|reschedule|cancel)\b/.test(t)) {
    ctx.intent = "scheduling";
  }
  if (/\bnew patient\b|\bfirst time\b/.test(t)) {
    ctx.isNewPatient = true;
  }
  if (/\bprimary care\b|\bpcp\b/.test(t)) {
    ctx.appointmentType = "primary care";
  } else if (/\bdoctor\b|\bdr\b|\bphysician\b/.test(t)) {
    ctx.appointmentType = "doctor visit";
  }
  if (/\bnext week\b/.test(t)) ctx.timePreference = "next week";
  if (/\btomorrow\b/.test(t)) ctx.timePreference = "tomorrow";
  if (/\b(morning|afternoon|evening)\b/.test(t)) {
    const match = t.match(/\b(morning|afternoon|evening)\b/);
    if (match?.[1]) ctx.timeOfDayPreference = match[1];
  }

  return ctx;
}

function inferIntentShiftNote(history: Message[], currentUserText: string): string | undefined {
  const lastUser = [...history]
    .reverse()
    .find((m) => m.role === "user" && m.content && m.content.trim().length > 0);
  if (!lastUser) return undefined;
  const prev = lastUser.content.toLowerCase();
  const curr = currentUserText.toLowerCase();
  const prevIntent = inferIntent(prev);
  const currIntent = inferIntent(curr);
  if (!prevIntent || !currIntent || prevIntent === currIntent) return undefined;
  return `User switched intent from ${prevIntent} to ${currIntent}.`;
}

function inferIntent(text: string): "scheduling" | "rescheduling" | "cancelling" | undefined {
  if (/\bresched(ule|uling)?\b/.test(text)) return "rescheduling";
  if (/\bcancel(l|ling|lation)?\b/.test(text)) return "cancelling";
  if (/\b(book|schedule|appointment)\b/.test(text)) return "scheduling";
  return undefined;
}

function planNextQuestion(
  known: Record<string, string | boolean>,
  currentUserText: string
): string | undefined {
  // Keep it minimal and operational: pick one missing slot.
  const intent = inferIntent(currentUserText.toLowerCase()) ?? (known.intent === "scheduling" ? "scheduling" : undefined);
  if (!intent) return undefined;

  if (intent === "scheduling") {
    if (!known.appointmentType) return "What type of appointment are you looking to schedule?";
    if (!known.timePreference) return "What day works best for you?";
    if (!known.timeOfDayPreference) return "Do you prefer morning, afternoon, or evening?";
    if (!("isNewPatient" in known)) return "Are you a new patient?";
    return "Would you like the first available appointment, or do you have a specific provider in mind?";
  }

  if (intent === "rescheduling") {
    return "What’s the date and time of the appointment you’d like to reschedule?";
  }

  if (intent === "cancelling") {
    return "What’s the date and time of the appointment you’d like to cancel?";
  }

  return undefined;
}

function findConflictingNames(input: { assistantName: string; text: string }): string[] {
  const assistant = input.assistantName.trim().toLowerCase();
  const out = new Set<string>();
  const re = /\bthis is\s+([A-Z][a-z]{2,})\b/g;
  for (const match of input.text.matchAll(re)) {
    const name = match[1];
    if (!name) continue;
    if (name.toLowerCase() === assistant) continue;
    out.add(name);
  }
  // Also catch "I'm Riley"
  const re2 = /\bI[' ]?m\s+([A-Z][a-z]{2,})\b/g;
  for (const match of input.text.matchAll(re2)) {
    const name = match[1];
    if (!name) continue;
    if (name.toLowerCase() === assistant) continue;
    out.add(name);
  }
  return [...out];
}

export function extractUserTextFromBody(body: {
  input?: string;
  messages?: unknown;
}): string | undefined {
  return (body.input && body.input.trim()) || extractLastUserTextFromUiMessages(body.messages);
}

