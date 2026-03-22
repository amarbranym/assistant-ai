import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authMiddleware, requireAuth } from "../../middlewares/auth.middleware";
import { authRateLimit } from "../../middlewares/rateLimiter.middleware";
import * as userController from "./user.controller";

const router = Router();

router.get(
  "/me",
  authMiddleware,
  requireAuth,
  authRateLimit,
  asyncHandler(userController.me)
);

export { router as userRoutes };
