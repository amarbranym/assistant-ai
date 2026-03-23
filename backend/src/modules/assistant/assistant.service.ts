import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
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

  const config = assistant.config as Record<string, unknown> & {
    model?: {
      model?: string;
      messages?: { role: string; content: string }[];
    };
    systemPrompt?: string;
  };

  const tools = getEnabledTools(toolsFromConfig(config));
  const history = await getRecentMessages({ conversationId, limit: 10 });

  const systemPrompt =
    config.model?.messages?.find((m) => m.role === "system")?.content ||
    (typeof config.systemPrompt === "string" ? config.systemPrompt : undefined) ||
    "You are a helpful assistant.";

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content
    })),
    { role: "user", content: input }
  ];

  saveMessage({ conversationId, role: "user", content: input }).catch(() => {});

  const modelString =
    (config.model &&
      typeof config.model === "object" &&
      config.model !== null &&
      typeof (config.model as { model?: string }).model === "string" &&
      (config.model as { model: string }).model) ||
    "gpt-4o";

  return streamText({
    model: openai(modelString),
    messages,
    tools,
    onFinish: async ({ text }) => {
      if (text) {
        await saveMessage({
          conversationId,
          role: "assistant",
          content: text
        }).catch(() => {});
      }
    }
  });
}
