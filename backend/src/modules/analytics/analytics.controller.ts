import type { NextFunction, Response } from "express";

import type { RequestWithUser } from "../../common/interfaces/request.interface";
import { ok } from "../../common/response/apiResponse";
import { AppError } from "../../common/errors/AppError";
import * as analyticsService from "./analytics.service";

export async function overview(req: RequestWithUser, res: Response, _next: NextFunction) {
  const data = await analyticsService.getOverview(req.user!.id);
  return ok(res, data);
}

export async function assistant(req: RequestWithUser, res: Response) {
  const { id } = req.params;
  const data = await analyticsService.getAssistantAnalytics(req.user!.id, id);
  if (!data) {
    throw new AppError(404, "Assistant not found", "NOT_FOUND");
  }
  return ok(res, data);
}

