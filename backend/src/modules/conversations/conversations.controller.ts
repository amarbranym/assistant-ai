import type { NextFunction, Response } from "express";

import { AppError } from "../../common/errors/AppError";
import type { RequestWithUser } from "../../common/interfaces/request.interface";
import { ok } from "../../common/response/apiResponse";
import * as conversationsService from "./conversations.service";

export async function listForAssistant(req: RequestWithUser, res: Response, _next: NextFunction) {
  const { id } = req.params;
  const limitRaw = req.query.limit;
  const limit = typeof limitRaw === "string" ? Number(limitRaw) : undefined;
  const data = await conversationsService.listConversationsForAssistant({
    userId: req.user!.id,
    assistantId: id,
    limit
  });
  if (!data) throw new AppError(404, "Assistant not found", "NOT_FOUND");
  return ok(res, { conversations: data });
}

export async function transcript(req: RequestWithUser, res: Response) {
  const { id, conversationId } = req.params;
  const data = await conversationsService.getConversationTranscript({
    userId: req.user!.id,
    assistantId: id,
    conversationId
  });
  if (!data) throw new AppError(404, "Conversation not found", "NOT_FOUND");
  return ok(res, data);
}

