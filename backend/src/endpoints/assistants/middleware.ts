import { authMiddleware } from "../../shared/middleware/auth.middleware";
import { requireAuth } from "../../shared/middleware/require-auth.middleware";
import { authRateLimit } from "../../shared/middleware/rate-limit.middleware";
import { validate } from "../../shared/middleware/validation.middleware";
import { createAssistantSchema } from "./types";

export const getMiddleware = [authMiddleware, requireAuth, authRateLimit];

export const postMiddleware = [
  authMiddleware,
  requireAuth,
  authRateLimit,
  validate(createAssistantSchema)
];

