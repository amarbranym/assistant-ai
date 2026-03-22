import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  createAssistant as createRepo,
  deleteAssistant as deleteRepo,
  getAssistantById,
  getRecentMessages,
  listAssistants,
  saveMessage,
  updateAssistant as updateRepo
} from "./assistant.repository";
import type { CreateAssistantDTO, UpdateAssistantDTO } from "./assistant.types";
import { getEnabledTools } from "./tools.registry";

export async function createAssistant(payload: CreateAssistantDTO) {
  return createRepo(payload);
}

export async function getAssistant(id: string) {
  return getAssistantById(id);
}

export async function getAssistants(filters?: {
  projectId?: string;
  activeOnly?: boolean;
}) {
  return listAssistants(filters);
}

export async function updateAssistant(id: string, payload: UpdateAssistantDTO) {
  return updateRepo(id, payload);
}

export async function removeAssistant(id: string) {
  await deleteRepo(id);
}

export async function processChat({
  assistantId,
  conversationId,
  input
}: {
  assistantId: string;
  conversationId: string;
  input: string;
}) {
  const assistant = await getAssistantById(assistantId);
  if (!assistant) throw new Error("Assistant not found");

  const config = assistant.config as Record<string, unknown> & {
    tools?: string[];
    model?: {
      model?: string;
      messages?: { role: string; content: string }[];
    };
  };

  const tools = getEnabledTools(config.tools || []);

  const history = await getRecentMessages({ conversationId, limit: 10 });

  const systemPrompt =
    config.model?.messages?.find((m) => m.role === "system")?.content ||
    "You are a helpful assistant.";

  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content
      })),
      { role: "user", content: input }
    ];

  saveMessage({ conversationId, role: "user", content: input }).catch(
    console.error
  );

  const modelString = config.model?.model || "gpt-4o";

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
        }).catch(console.error);
      }
    }
  });
}
