import { ErrorRequestHandler } from "express";
import { logger } from "../../config/clients/logger";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ err }, "Unhandled error");

  const status = err.status || 500;
  const message = status === 500 ? "Internal server error" : err.message;

  res.status(status).json({
    success: false,
    error: {
      message,
      code: err.code || "INTERNAL_ERROR"
    }
  });
};
