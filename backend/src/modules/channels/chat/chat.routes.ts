import { Router } from "express";

import { asyncHandler } from "../../../utils/asyncHandler";
import { authMiddleware, requireAuth } from "../../../middlewares/auth.middleware";
import { authRateLimit } from "../../../middlewares/rateLimiter.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import * as chatController from "./chat.controller";
import { chatStreamSchema } from "./chat.model";

const router = Router();

const protectedChain = [authMiddleware, requireAuth, authRateLimit];

router.post(
  "/stream",
  ...protectedChain,
  validate(chatStreamSchema),
  asyncHandler(chatController.stream)
);

export { router as chatRoutes };

