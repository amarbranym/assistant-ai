import { NextFunction, Response } from "express";
import type { RequestWithUser } from "../common/interfaces/request.interface";
import { requireAuthGuard } from "../common/guards/auth.guard";
import { verifySupabaseAccessToken } from "../modules/auth";

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

  void verifySupabaseAccessToken(token)
    .then((payload) => {
      req.user = {
        id: payload.sub,
        email: payload.email || undefined,
        name: payload.name
      };
    })
    .catch(() => {
      // Invalid token — anonymous
    })
    .finally(() => {
      next();
    });
}

export const requireAuth = requireAuthGuard;
