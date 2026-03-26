import type { NextFunction, Response } from "express";
import type { UIMessage } from "ai";

import { AppError } from "../../../common/errors/AppError";
import type { RequestWithUser } from "../../../common/interfaces/request.interface";
import * as chatService from "./chat.service";
import type { ChatStreamBody } from "./chat.model";

function pickString(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "string" && v.trim() ? v : undefined;
}

export async function stream(req: RequestWithUser, res: Response, _next: NextFunction) {
  const body = (req.validatedBody ?? {}) as ChatStreamBody;

  const assistantId = body.assistantId ?? pickString(body.data, "assistantId");
  const conversationId = body.conversationId ?? pickString(body.data, "conversationId");

  if (!assistantId) {
    throw new AppError(400, "Missing assistantId", "INVALID_BODY");
  }

  const userText = chatService.extractUserTextFromBody({
    input: body.input,
    messages: body.messages
  });

  if (!userText || !userText.trim()) {
    throw new AppError(400, "Missing input", "INVALID_BODY");
  }

  const userId = req.user!.id;
  const assistant = await chatService.getAssistantForUser(assistantId, userId);
  const conversation = await chatService.getOrCreateConversation({
    assistantId: assistant.id,
    conversationId
  });

  const abortController = new AbortController();
  req.on("close", () => abortController.abort());

  const { result } = await chatService.streamAssistantReply({
    assistant,
    conversationId: conversation.id,
    userText,
    abortSignal: abortController.signal
  });

  res.setHeader("x-conversation-id", conversation.id);

  // Stream UI message chunks (what DefaultChatTransport / useChat expects).
  const originalMessages = Array.isArray(body.messages)
    ? (body.messages as UIMessage[])
    : undefined;
  result.pipeUIMessageStreamToResponse(res, { originalMessages });
}

