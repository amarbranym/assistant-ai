import { NextFunction, Response } from "express";
import type { RequestWithUser } from "../types/common.types";

export function requireAuth(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: "Unauthorized" }
    });
  }

  next();
}

