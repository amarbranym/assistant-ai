import { NextFunction, Response } from "express";
import { redis } from "../config/redis";
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

    const tx = redis.multi();
    tx.zremrangebyscore(key, 0, windowStart);
    tx.zadd(key, { score: now, member: String(now) });
    tx.zcard(key);
    tx.expire(key, windowSeconds);

    const [, , count] = (await tx.exec()) as [unknown, unknown, number, unknown];

    if (count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          message: "Too many requests",
          code: "RATE_LIMITED"
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
