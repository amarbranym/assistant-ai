import { Router } from "express";

import { ok } from "../../common/response/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get(
  "/health",
  asyncHandler(async (_req, res) => {
    return ok(res, { status: "ok" });
  })
);

export { router as llmRoutes };

