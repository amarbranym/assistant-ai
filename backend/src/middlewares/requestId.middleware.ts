import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

import { logger } from "../config/logger";

declare module "express-serve-static-core" {
  interface Request {
    /** Unique ID attached to this request; surfaces in logs and error responses. */
    requestId?: string;
    log?: ReturnType<typeof logger.child>;
  }
}

/**
 * Assigns `req.requestId` from an inbound `x-request-id` header (trusted reverse proxy)
 * or mints a new UUID. Echoed back as a response header so clients and tracing tools
 * can correlate logs across services.
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const incoming = req.header("x-request-id")?.trim();
  const requestId = incoming && incoming.length <= 200 ? incoming : randomUUID();
  req.requestId = requestId;
  req.log = logger.child({ requestId, path: req.path, method: req.method });
  res.setHeader("x-request-id", requestId);
  next();
}
