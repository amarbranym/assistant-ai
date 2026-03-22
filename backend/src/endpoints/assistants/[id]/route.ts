import { NextFunction, Response } from "express";
import * as assistantService from "../../../modules/assistant/assistant.service";
import { noContent, ok } from "../../../shared/utils/response";
import type {
  GetAssistantRequest,
  UpdateAssistantRequest,
  DeleteAssistantRequest
} from "./types";
export { getMiddleware, putMiddleware, deleteMiddleware } from "./middleware";

export async function GET(
  req: GetAssistantRequest,
  res: Response,
  _next: NextFunction
) {
  const { id } = req.params;
  const assistant = await assistantService.getAssistant(id);
  if (!assistant) {
    return noContent(res);
  }
  return ok(res, assistant);
}

export async function PUT(
  req: UpdateAssistantRequest,
  res: Response,
  _next: NextFunction
) {
  const { id } = req.params;
  const updated = await assistantService.updateAssistant(
    id,
    req.validatedBody
  );
  return ok(res, updated);
}

export async function DELETE(
  req: DeleteAssistantRequest,
  res: Response,
  _next: NextFunction
) {
  const { id } = req.params;
  await assistantService.removeAssistant(id);
  return noContent(res);
}

