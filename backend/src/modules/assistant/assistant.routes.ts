import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authMiddleware, requireAuth } from "../../middlewares/auth.middleware";
import { authRateLimit } from "../../middlewares/rateLimiter.middleware";
import { validate } from "../../middlewares/validate.middleware";
import * as assistantController from "./assistant.controller";
import { createAssistantSchema, updateAssistantSchema } from "./assistant.validation";

const router = Router();

const protectedChain = [authMiddleware, requireAuth, authRateLimit];

router.post("/test/chat", asyncHandler(assistantController.testChatStream));

router.get("/", ...protectedChain, asyncHandler(assistantController.list));

router.post(
  "/",
  ...protectedChain,
  validate(createAssistantSchema),
  asyncHandler(assistantController.create)
);

router.get("/:id", ...protectedChain, asyncHandler(assistantController.getById));

router.put(
  "/:id",
  ...protectedChain,
  validate(updateAssistantSchema),
  asyncHandler(assistantController.update)
);

router.delete(
  "/:id",
  ...protectedChain,
  asyncHandler(assistantController.remove)
);

export { router as assistantRoutes };
