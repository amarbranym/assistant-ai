import { NextFunction, Response } from "express";
import type { RequestWithUser } from "../common/interfaces/request.interface";
import { requireAuthGuard } from "../common/guards/auth.guard";
import { AppError } from "../common/errors/AppError";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { getPrismaClient } from "../lib/prismaClient";
import { verifySupabaseAccessToken } from "../modules/auth";

const prisma = getPrismaClient();
const DEV_USER = {
  id: process.env.DEV_USER_ID?.trim() || "dev-user",
  email: process.env.DEV_USER_EMAIL?.trim() || "dev@assistant.local",
  name: process.env.DEV_USER_NAME?.trim() || "Developer"
};
let devUserReady: Promise<void> | null = null;

function ensureDevUser(): Promise<void> {
  if (!devUserReady) {
    devUserReady = prisma.user
      .upsert({
        where: { id: DEV_USER.id },
        create: {
          id: DEV_USER.id,
          email: DEV_USER.email,
          name: DEV_USER.name
        },
        update: {
          email: DEV_USER.email,
          name: DEV_USER.name
        }
      })
      .then(() => undefined)
      .catch((err) => {
        logger.error({ err }, "Failed to seed dev user");
        devUserReady = null; // allow retry on next request
      });
  }
  return devUserReady;
}

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
    if (!env.allowDevAuthFallback) {
      return next(
        new AppError(401, "Missing authentication token", "AUTH_REQUIRED")
      );
    }
    req.user = DEV_USER;
    void ensureDevUser().finally(() => next());
    return;
  }

  void verifySupabaseAccessToken(token)
    .then((payload) => {
      req.user = {
        id: payload.sub,
        email: payload.email || undefined,
        name: payload.name
      };
      next();
    })
    .catch((err) => {
      if (!env.allowDevAuthFallback) {
        logger.warn({ err: err instanceof Error ? err.message : err }, "Auth token verification failed");
        return next(
          new AppError(401, "Invalid or expired authentication token", "AUTH_INVALID")
        );
      }
      req.user = DEV_USER;
      void ensureDevUser().finally(() => next());
    });
}

export const requireAuth = requireAuthGuard;
