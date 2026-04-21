import type { NextFunction, Response } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";

import { AppError } from "../../common/errors/AppError";
import type { RequestWithUser } from "../../common/interfaces/request.interface";
import { created, noContent, ok } from "../../common/response/apiResponse";
import * as assistantService from "./assistant.service";
import type { CreateAssistantBody, UpdateAssistantBody } from "./assistant.validation";

export async function list(
  req: RequestWithUser,
  res: Response,
  _next: NextFunction
) {
  const filters = {
    projectId: req.query.projectId as string | undefined,
    activeOnly: req.query.activeOnly === "true"
  };
  const assistants = await assistantService.getAssistants(req.user!.id, filters);
  return ok(res, assistants);
}

export async function create(
  req: RequestWithUser,
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

  const assistant = await assistantService.createAssistant(req.user!.id, body);
  return created(res, assistant);
}

export async function getById(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const { id } = req.params;
  const assistant = await assistantService.getAssistant(id, req.user!.id);
  if (!assistant) return next(new AppError(404, "Assistant not found", "NOT_FOUND"));
  return ok(res, assistant);
}

export async function update(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const body = req.validatedBody as UpdateAssistantBody | undefined;
  if (!body) {
    return res.status(400).json({
      success: false,
      error: { message: "Invalid request body", code: "INVALID_BODY" }
    });
  }

  const { id } = req.params;
  const updated = await assistantService.updateAssistant(id, req.user!.id, body);
  if (!updated) return next(new AppError(404, "Assistant not found", "NOT_FOUND"));
  return ok(res, updated);
}

export async function remove(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  const { id } = req.params;
  const removed = await assistantService.removeAssistant(id, req.user!.id);
  if (!removed) return next(new AppError(404, "Assistant not found", "NOT_FOUND"));
  return noContent(res);
}

export async function testChatStream(req: RequestWithUser, res: Response) {
  const { assistantId, conversationId, input, mode } = req.body as {
    assistantId?: string;
    conversationId?: string;
    input?: string;
    mode?: "test" | "live";
  };

  if (!assistantId || !conversationId || !input) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Missing required fields: assistantId, conversationId, input",
        code: "INVALID_BODY"
      }
    });
  }

  try {
    const result = await assistantService.processChat({
      assistantId,
      conversationId,
      input,
      userId: req.user!.id,
      mode: mode === "live" ? "live" : "test"
    });
    result.pipeTextStreamToResponse(res);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Assistant not found" ? 404 : 500;
    return res.status(status).json({
      success: false,
      error: { message, code: status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR" }
    });
  }
}

const knowledgeSourceSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["url", "text", "file"]),
  name: z.string().min(1),
  content: z.string().optional(),
  enabled: z.boolean().optional()
});

export async function listKnowledgeSources(req: RequestWithUser, res: Response) {
  const { id } = req.params;
  const sources = await assistantService.listKnowledgeSources({
    assistantId: id,
    userId: req.user!.id
  });
  return ok(res, { sources });
}

export async function addKnowledgeSource(req: RequestWithUser, res: Response) {
  const { id } = req.params;
  const parsed = knowledgeSourceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { message: "Invalid request body", code: "INVALID_BODY", details: parsed.error.issues }
    });
  }
  const data = parsed.data;
  const updated = await assistantService.addKnowledgeSource({
    assistantId: id,
    userId: req.user!.id,
    source: {
      id: data.id ?? randomUUID(),
      type: data.type,
      name: data.name,
      content: data.content,
      enabled: data.enabled ?? true,
      status: "processing"
    }
  });
  return created(res, updated);
}

const knowledgeSourcePatchSchema = z
  .object({
    type: z.enum(["url", "text", "file"]).optional(),
    name: z.string().min(1).optional(),
    content: z.string().optional(),
    enabled: z.boolean().optional()
  })
  .strict();

export async function updateKnowledgeSource(req: RequestWithUser, res: Response) {
  const { id, sourceId } = req.params;
  const parsed = knowledgeSourcePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { message: "Invalid request body", code: "INVALID_BODY", details: parsed.error.issues }
    });
  }
  const updated = await assistantService.updateKnowledgeSource({
    assistantId: id,
    sourceId,
    userId: req.user!.id,
    patch: parsed.data
  });
  return ok(res, updated);
}

export async function refreshKnowledgeSource(req: RequestWithUser, res: Response) {
  const { id, sourceId } = req.params;
  const updated = await assistantService.refreshKnowledgeSource({
    assistantId: id,
    sourceId,
    userId: req.user!.id
  });
  return ok(res, updated);
}

export async function removeKnowledgeSource(req: RequestWithUser, res: Response) {
  const { id, sourceId } = req.params;
  const updated = await assistantService.removeKnowledgeSource({
    assistantId: id,
    sourceId,
    userId: req.user!.id
  });
  return ok(res, updated);
}

export async function publishReadiness(req: RequestWithUser, res: Response) {
  const { id } = req.params;
  const data = await assistantService.getPublishReadiness({
    assistantId: id,
    userId: req.user!.id
  });
  return ok(res, data);
}

export async function publish(req: RequestWithUser, res: Response) {
  const { id } = req.params;
  const updated = await assistantService.publishAssistant({
    assistantId: id,
    userId: req.user!.id
  });
  return ok(res, updated);
}

export async function unpublish(req: RequestWithUser, res: Response) {
  const { id } = req.params;
  const updated = await assistantService.unpublishAssistant({
    assistantId: id,
    userId: req.user!.id
  });
  return ok(res, updated);
}
