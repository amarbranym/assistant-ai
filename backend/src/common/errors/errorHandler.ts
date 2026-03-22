import { Prisma } from "@prisma/client";
import { ErrorRequestHandler } from "express";
import { logger } from "../../config/logger";
import { AppError } from "./AppError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof Prisma.PrismaClientInitializationError) {
    logger.error({ err }, "Database unavailable");
    return res.status(503).json({
      success: false,
      error: {
        message:
          "Database is unreachable. Check DATABASE_URL in .env, that the database is running (e.g. Supabase project not paused), and try the Supabase pooler URL (port 6543) if direct port 5432 is blocked.",
        code: "DATABASE_UNAVAILABLE"
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
    logger.error({ err }, "Unhandled error");
  } else {
    logger.warn({ err }, "Request error");
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
      code
    }
  });
};
