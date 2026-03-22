import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getAssistant } from "./assistant.service";
import { getRecentMessages, saveMessage } from "./conversation.repository";
import { getEnabledTools } from "../tools/tools.registry";

export async function processChat({
  assistantId,
  conversationId,
  input
}: {
  assistantId: string;
  conversationId: string;
  input: string;
}) {
  const assistant = await getAssistant(assistantId);
  if (!assistant) throw new Error("Assistant not found");

  const config = assistant.config as any;
  const tools = getEnabledTools(config.tools || []);

  const history = await getRecentMessages({ conversationId, limit: 10 });
  
  // Get system prompt from config
  const systemPrompt = config.model?.messages?.find((m: any) => m.role === "system")?.content 
    || "You are a helpful assistant.";

  // Format history
  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...history.map(m => ({ role: m.role as any, content: m.content })),
    { role: "user", content: input }
  ];

  // Fire and forget save user message
  saveMessage({ conversationId, role: "user", content: input }).catch(console.error);

  const modelString = config.model?.model || "gpt-4o";

  const result = streamText({
    model: openai(modelString),
    messages,
    tools,
    // @ts-ignore
    maxSteps: 5, // allows dynamic tool execution and returning final answer
    onFinish: async ({ text }) => {
      if (text) {
         await saveMessage({ conversationId, role: "assistant", content: text }).catch(console.error);
      }
    }
  });

  return result;
}
