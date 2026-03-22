import { NextFunction, Response } from "express";
import * as assistantService from "../../modules/assistant/assistant.service";
import { ok, created } from "../../shared/utils/response";
import type { ListAssistantsRequest, CreateAssistantRequest } from "./types";
export { getMiddleware, postMiddleware } from "./middleware";

export async function GET(
  req: ListAssistantsRequest,
  res: Response,
  _next: NextFunction
) {
  const filters = {
    projectId: req.query?.projectId,
    activeOnly: req.query?.activeOnly === "true"
  };
  const assistants = await assistantService.getAssistants(filters);
  return ok(res, assistants);
}

export async function POST(
  req: CreateAssistantRequest,
  res: Response,
  _next: NextFunction
) {
  // Extra runtime safety: validatedBody should be set by validation middleware,
  // but we guard against misconfigured clients or middleware.
  if (!req.validatedBody) {
    return res.status(400).json({
      success: false,
      error: { message: "Invalid request body" }
    });
  }

  const assistant = await assistantService.createAssistant(req.validatedBody);
  return created(res, assistant);
}

