import { Router } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { authMiddleware, requireAuth } from "../../middlewares/auth.middleware";
import { authRateLimit } from "../../middlewares/rateLimiter.middleware";
import * as voiceController from "./voice.controller";

const router = Router();
const protectedChain = [authMiddleware, requireAuth, authRateLimit];

router.post("/session", ...protectedChain, asyncHandler(voiceController.createSession));
router.get("/voices", ...protectedChain, asyncHandler(voiceController.listVoices));
router.post("/voices/preview", ...protectedChain, asyncHandler(voiceController.previewVoice));
router.post("/voices/custom", ...protectedChain, asyncHandler(voiceController.uploadCustomVoice));

export { router as voiceRoutes };

