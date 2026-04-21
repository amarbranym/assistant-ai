import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { authMiddleware, requireAuth } from "../../middlewares/auth.middleware";
import { authRateLimit } from "../../middlewares/rateLimiter.middleware";
import * as analyticsController from "./analytics.controller";

const router = Router();
const protectedChain = [authMiddleware, requireAuth, authRateLimit];

router.get("/overview", ...protectedChain, asyncHandler(analyticsController.overview));
router.get("/assistants/:id", ...protectedChain, asyncHandler(analyticsController.assistant));

export { router as analyticsRoutes };

