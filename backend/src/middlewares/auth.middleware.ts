import { NextFunction, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import type { RequestWithUser } from "../common/interfaces/request.interface";
import { requireAuthGuard } from "../common/guards/auth.guard";

export function authMiddleware(
  req: RequestWithUser,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  let token: string | undefined;

  if (typeof header === "string" && header.startsWith("Bearer ")) {
    token = header.slice(7).trim();
  }

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email || undefined
    };
  } catch {
    // Invalid token — anonymous
  }

  next();
}

export const requireAuth = requireAuthGuard;
