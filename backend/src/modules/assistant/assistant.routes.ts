import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authMiddleware, requireAuth } from "../../middlewares/auth.middleware";
import { authRateLimit } from "../../middlewares/rateLimiter.middleware";
import { validate } from "../../middlewares/validate.middleware";
import * as assistantController from "./assistant.controller";
import { createAssistantSchema, updateAssistantSchema } from "./assistant.validation";

const router = Router();

const protectedChain = [authMiddleware, requireAuth, authRateLimit];

router.post(
  "/test/chat",
  ...protectedChain,
  asyncHandler(assistantController.testChatStream)
);

router.get("/", ...protectedChain, asyncHandler(assistantController.list));

router.post(
  "/",
  ...protectedChain,
  validate(createAssistantSchema),
  asyncHandler(assistantController.create)
);

router.get("/:id", ...protectedChain, asyncHandler(assistantController.getById));

router.get(
  "/:id/knowledge",
  ...protectedChain,
  asyncHandler(assistantController.listKnowledgeSources)
);
router.post(
  "/:id/knowledge",
  ...protectedChain,
  asyncHandler(assistantController.addKnowledgeSource)
);
router.patch(
  "/:id/knowledge/:sourceId",
  ...protectedChain,
  asyncHandler(assistantController.updateKnowledgeSource)
);
router.post(
  "/:id/knowledge/:sourceId/refresh",
  ...protectedChain,
  asyncHandler(assistantController.refreshKnowledgeSource)
);
router.delete(
  "/:id/knowledge/:sourceId",
  ...protectedChain,
  asyncHandler(assistantController.removeKnowledgeSource)
);

router.get(
  "/:id/publish/readiness",
  ...protectedChain,
  asyncHandler(assistantController.publishReadiness)
);
router.post(
  "/:id/publish",
  ...protectedChain,
  asyncHandler(assistantController.publish)
);
router.post(
  "/:id/unpublish",
  ...protectedChain,
  asyncHandler(assistantController.unpublish)
);

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
