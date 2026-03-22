import { NextFunction, Response } from "express";
import type { RequestWithUser } from "../interfaces/request.interface";

/**
 * Ensures `req.user` exists (run after `authMiddleware` attaches Bearer user).
 */
export function requireAuthGuard(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: "Unauthorized", code: "UNAUTHORIZED" }
    });
  }
  next();
}
