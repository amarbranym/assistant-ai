import { Prisma } from "@prisma/client";
import { ErrorRequestHandler } from "express";
import { logger } from "../../config/logger";
import { isDev } from "../../config/env";
import { AppError } from "./AppError";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = req.requestId;
  const log = req.log ?? logger;

  if (err instanceof Prisma.PrismaClientInitializationError) {
    log.error({ err }, "Database unavailable");
    return res.status(503).json({
      success: false,
      error: {
        message:
          "Database is unreachable. Check DATABASE_URL in .env, that the database is running (e.g. Supabase project not paused), and try the Supabase pooler URL (port 6543) if direct port 5432 is blocked.",
        code: "DATABASE_UNAVAILABLE",
        requestId
      }
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    log.error({ err }, "Prisma request error");
    return res.status(500).json({
      success: false,
      error: {
        message: isDev ? err.message : "Internal server error",
        code: err.code,
        requestId
      }
    });
  }

  const isApp = err instanceof AppError;
  const status = isApp
    ? err.status
    : typeof (err as { status?: number }).status === "number"
      ? (err as { status: number }).status
      : 500;

  if (status >= 500) {
    log.error({ err }, "Unhandled error");
  } else {
    log.warn({ err }, "Request error");
  }

  const message =
    status === 500
      ? "Internal server error"
      : err.message || "Request error";
  const code = isApp
    ? err.code
    : typeof (err as { code?: string }).code === "string"
      ? (err as { code: string }).code
      : "INTERNAL_ERROR";

  res.status(status).json({
    success: false,
    error: {
      message,
      code,
      requestId
    }
  });
};
