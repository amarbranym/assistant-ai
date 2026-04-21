import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { authMiddleware, requireAuth } from "../../middlewares/auth.middleware";
import { authRateLimit } from "../../middlewares/rateLimiter.middleware";
import * as conversationsController from "./conversations.controller";

const router = Router();
const protectedChain = [authMiddleware, requireAuth, authRateLimit];

router.get("/assistants/:id/conversations", ...protectedChain, asyncHandler(conversationsController.listForAssistant));
router.get(
  "/assistants/:id/conversations/:conversationId",
  ...protectedChain,
  asyncHandler(conversationsController.transcript)
);

export { router as conversationsRoutes };

