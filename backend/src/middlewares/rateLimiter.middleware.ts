import { NextFunction, Response } from "express";
import { redis } from "../config/redis";
import { logger } from "../config/logger";
import type { RequestWithUser } from "../common/interfaces/request.interface";

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix?: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowSeconds, maxRequests, keyPrefix = "rl" } = options;

  return async function rateLimit(
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) {
    const identifier =
      req.user?.id || req.ip || req.headers["x-forwarded-for"] || "anonymous";
    const key = `${keyPrefix}:${identifier}`;

    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSeconds;

    let count: number | null = null;
    try {
      const tx = redis.multi();
      tx.zremrangebyscore(key, 0, windowStart);
      tx.zadd(key, { score: now, member: String(now) });
      tx.zcard(key);
      tx.expire(key, windowSeconds);
      const [, , c] = (await tx.exec()) as [unknown, unknown, number, unknown];
      count = typeof c === "number" ? c : null;
    } catch (err) {
      // Upstash outage or transient network error. Fail OPEN with a warning
      // rather than 500-ing every rate-limited route. The window is 60s so
      // a brief blip won't materially degrade protection.
      (req.log ?? logger).warn(
        { err: err instanceof Error ? err.message : err, keyPrefix },
        "Rate limiter: Redis unavailable, failing open"
      );
      return next();
    }

    if (count !== null && count > maxRequests) {
      res.setHeader("Retry-After", String(windowSeconds));
      return res.status(429).json({
        success: false,
        error: {
          message: "Too many requests",
          code: "RATE_LIMITED",
          requestId: req.requestId
        }
      });
    }

    next();
  };
}

export const authRateLimit = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 60,
  keyPrefix: "rl:auth"
});
