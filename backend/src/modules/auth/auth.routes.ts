import { Router, urlencoded } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authRateLimit } from "../../middlewares/rateLimiter.middleware";
import { validate } from "../../middlewares/validate.middleware";
import * as authController from "./auth.controller";
import * as oauthController from "./oauth.controller";
import { loginBodySchema, registerBodySchema } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  authRateLimit,
  validate(registerBodySchema),
  asyncHandler(authController.register)
);

router.post(
  "/login",
  authRateLimit,
  validate(loginBodySchema),
  asyncHandler(authController.login)
);

router.post("/logout", authRateLimit, asyncHandler(authController.logout));

router.get("/oauth/google", authRateLimit, asyncHandler(oauthController.startGoogle));
router.get(
  "/oauth/google/callback",
  authRateLimit,
  asyncHandler(oauthController.callbackGoogle)
);

router.get("/oauth/github", authRateLimit, asyncHandler(oauthController.startGitHub));
router.get(
  "/oauth/github/callback",
  authRateLimit,
  asyncHandler(oauthController.callbackGitHub)
);

router.get("/oauth/apple", authRateLimit, asyncHandler(oauthController.startApple));
router.post(
  "/oauth/apple/callback",
  urlencoded({ extended: true }),
  authRateLimit,
  asyncHandler(oauthController.callbackApple)
);

export { router as authRoutes };
