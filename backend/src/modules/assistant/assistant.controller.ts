import type { NextFunction, Request, Response } from "express";
import { created, noContent, ok } from "../../common/response/apiResponse";
import * as assistantService from "./assistant.service";
import type { CreateAssistantBody, UpdateAssistantBody } from "./assistant.validation";

export async function list(req: Request, res: Response, _next: NextFunction) {
  const filters = {
    projectId: req.query.projectId as string | undefined,
    activeOnly: req.query.activeOnly === "true"
  };
  const assistants = await assistantService.getAssistants(filters);
  return ok(res, assistants);
}

export async function create(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const body = req.validatedBody as CreateAssistantBody | undefined;
  if (!body) {
    return res.status(400).json({
      success: false,
      error: { message: "Invalid request body", code: "INVALID_BODY" }
    });
  }

  const assistant = await assistantService.createAssistant(body);
  return created(res, assistant);
}

export async function getById(req: Request, res: Response, _next: NextFunction) {
  const { id } = req.params;
  const assistant = await assistantService.getAssistant(id);
  if (!assistant) {
    return noContent(res);
  }
  return ok(res, assistant);
}

export async function update(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const body = req.validatedBody as UpdateAssistantBody | undefined;
  if (!body) {
    return res.status(400).json({
      success: false,
      error: { message: "Invalid request body", code: "INVALID_BODY" }
    });
  }

  const { id } = req.params;
  const updated = await assistantService.updateAssistant(id, body);
  return ok(res, updated);
}

export async function remove(req: Request, res: Response, _next: NextFunction) {
  const { id } = req.params;
  await assistantService.removeAssistant(id);
  return noContent(res);
}

export async function testChatStream(req: Request, res: Response) {
  const { assistantId, conversationId, input } = req.body as {
    assistantId?: string;
    conversationId?: string;
    input?: string;
  };

  if (!assistantId || !conversationId || !input) {
    return res.status(400).json({
      error: "Missing required fields: assistantId, conversationId, input"
    });
  }

  try {
    const result = await assistantService.processChat({
      assistantId,
      conversationId,
      input
    });
    result.pipeTextStreamToResponse(res);
  } catch (err) {
    console.error("Chat error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
