import type { ModelMessage } from "ai";
import {
  createAssistant as createRepo,
  deleteAssistant as deleteRepo,
  getAssistantByIdForUser,
  getRecentMessages,
  listAssistantsForUser,
  saveMessage,
  updateAssistant as updateRepo
} from "./assistant.repository";
import type { CreateAssistantDTO, UpdateAssistantDTO } from "./assistant.types";
import { getEnabledTools } from "./tools.registry";
import { resolveLlmConfigFromAssistantConfig, streamTextResponseSafe } from "../llm/llm.service";
import { buildRuntimeSystemPrompt } from "../llm/prompt.builder";
import type { Role } from "@prisma/client";

function toolsFromConfig(config: Record<string, unknown>): string[] {
  const raw = config.tools;
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .filter(([, v]) => v === true)
      .map(([k]) => k);
  }
  return [];
}

export async function createAssistant(userId: string, payload: CreateAssistantDTO) {
  return createRepo(userId, payload);
}

export async function getAssistant(id: string, userId: string) {
  return getAssistantByIdForUser(id, userId);
}

export async function getAssistants(
  userId: string,
  filters?: {
    projectId?: string;
    activeOnly?: boolean;
  }
) {
  return listAssistantsForUser(userId, filters);
}

export async function updateAssistant(
  id: string,
  userId: string,
  payload: UpdateAssistantDTO
) {
  return updateRepo(id, userId, payload);
}

export async function removeAssistant(id: string, userId: string) {
  return deleteRepo(id, userId);
}

export async function processChat({
  assistantId,
  conversationId,
  input,
  userId
}: {
  assistantId: string;
  conversationId: string;
  input: string;
  userId: string;
}) {
  const assistant = await getAssistantByIdForUser(assistantId, userId);
  if (!assistant) throw new Error("Assistant not found");

  const config = assistant.config as Record<string, unknown>;
  const tools = getEnabledTools(toolsFromConfig(config));
  const history = await getRecentMessages({ conversationId, limit: 10 });

  const hasPriorAssistantTurn = history.some((m) => m.role === "assistant");
  const llmConfig = resolveLlmConfigFromAssistantConfig(config, { tools });
  const conflictingNames = findConflictingNames({
    assistantName: assistant.name,
    text: llmConfig.systemPrompt
  });
  const bannedPhrases = hasPriorAssistantTurn
    ? [
        "Thank you for calling",
        "This is",
        `This is ${assistant.name}`,
        ...conflictingNames.map((n) => `This is ${n}`),
        ...conflictingNames
      ]
    : [];
  const plannedNextQuestion = undefined;
  const runtimeSystemPrompt = buildRuntimeSystemPrompt({
    assistantName: assistant.name,
    assistantDescription: assistant.description ?? null,
    baseSystemPrompt: llmConfig.systemPrompt,
    channel: "chat",
    hasPriorAssistantTurn,
    bannedPhrases,
    plannedNextQuestion,
    conflictingNames
  });

  const messages: ModelMessage[] = [
    { role: "system", content: runtimeSystemPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content
    })),
    { role: "user", content: input }
  ];

  saveMessage({ conversationId, role: "user" satisfies Role, content: input }).catch(
    () => {}
  );

  return streamTextResponseSafe({
    config: llmConfig,
    messages,
    onFinish: async ({ text }) => {
      if (text) {
        await saveMessage({
          conversationId,
          role: "assistant" satisfies Role,
          content: text
        }).catch(() => {});
      }
    }
  });
}

function findConflictingNames(input: { assistantName: string; text: string }): string[] {
  const assistantLower = input.assistantName.trim().toLowerCase();
  const out = new Set<string>();
  const re = /\bthis is\s+([A-Z][a-z]{2,})\b/g;
  for (const match of input.text.matchAll(re)) {
    const name = match[1];
    if (!name) continue;
    if (name.toLowerCase() === assistantLower) continue;
    out.add(name);
  }
  const re2 = /\bI[' ]?m\s+([A-Z][a-z]{2,})\b/g;
  for (const match of input.text.matchAll(re2)) {
    const name = match[1];
    if (!name) continue;
    if (name.toLowerCase() === assistantLower) continue;
    out.add(name);
  }
  return [...out];
}
