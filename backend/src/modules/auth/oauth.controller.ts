import type { Request, Response } from "express";
import { env } from "../../config/env";
import { AppError } from "../../common/errors/AppError";
import * as authService from "./auth.service";
import * as oauthService from "./oauth.service";
import * as oauthState from "./oauth-state.service";

function redirectOAuthError(message: string, code: string) {
  const base = env.frontendOAuthSuccessUrl.replace(/#.*$/, "");
  const fragment = `error=oauth_failed&error_code=${encodeURIComponent(code)}&message=${encodeURIComponent(message)}`;
  return (res: Response) => res.redirect(302, `${base}#${fragment}`);
}

function redirectOAuthSuccess(accessToken: string) {
  const base = env.frontendOAuthSuccessUrl.replace(/#.*$/, "");
  const fragment = `access_token=${encodeURIComponent(accessToken)}&token_type=Bearer`;
  return (res: Response) => res.redirect(302, `${base}#${fragment}`);
}

export async function startGoogle(_req: Request, res: Response) {
  oauthService.assertGoogleOAuthConfigured();
  const state = await oauthState.issueOAuthState("google");
  res.redirect(302, oauthService.buildGoogleAuthorizeUrl(state));
}

export async function startGitHub(_req: Request, res: Response) {
  oauthService.assertGitHubOAuthConfigured();
  const state = await oauthState.issueOAuthState("github");
  res.redirect(302, oauthService.buildGitHubAuthorizeUrl(state));
}

export async function startApple(_req: Request, res: Response) {
  oauthService.assertAppleOAuthConfigured();
  const state = await oauthState.issueOAuthState("apple");
  res.redirect(302, oauthService.buildAppleAuthorizeUrl(state));
}

export async function callbackGoogle(req: Request, res: Response) {
  try {
    const qErr = req.query.error as string | undefined;
    if (qErr) {
      const desc = req.query.error_description as string | undefined;
      throw new AppError(
        400,
        desc || qErr || "Authorization was denied",
        "OAUTH_DENIED"
      );
    }

    const state = await oauthState.consumeOAuthState(
      req.query.state as string | undefined
    );
    oauthService.assertCallbackProvider("google", state);

    const code = req.query.code as string | undefined;
    if (!code) {
      throw new AppError(400, "Missing authorization code", "OAUTH_MISSING_CODE");
    }

    const profile = await oauthService.completeGoogleOAuth(code);
    const session = await authService.signInWithOAuthProfile(profile);
    return redirectOAuthSuccess(session.accessToken)(res);
  } catch (err) {
    if (err instanceof AppError) {
      return redirectOAuthError(err.message, err.code)(res);
    }
    return redirectOAuthError("OAuth sign-in failed", "OAUTH_FAILED")(res);
  }
}

export async function callbackGitHub(req: Request, res: Response) {
  try {
    const qErr = req.query.error as string | undefined;
    if (qErr) {
      const desc = req.query.error_description as string | undefined;
      throw new AppError(
        400,
        desc || qErr || "Authorization was denied",
        "OAUTH_DENIED"
      );
    }

    const state = await oauthState.consumeOAuthState(
      req.query.state as string | undefined
    );
    oauthService.assertCallbackProvider("github", state);

    const code = req.query.code as string | undefined;
    if (!code) {
      throw new AppError(400, "Missing authorization code", "OAUTH_MISSING_CODE");
    }

    const profile = await oauthService.completeGitHubOAuth(code);
    const session = await authService.signInWithOAuthProfile(profile);
    return redirectOAuthSuccess(session.accessToken)(res);
  } catch (err) {
    if (err instanceof AppError) {
      return redirectOAuthError(err.message, err.code)(res);
    }
    return redirectOAuthError("OAuth sign-in failed", "OAUTH_FAILED")(res);
  }
}

export async function callbackApple(req: Request, res: Response) {
  try {
    const state = await oauthState.consumeOAuthState(
      req.body?.state as string | undefined
    );
    oauthService.assertCallbackProvider("apple", state);

    const code = req.body?.code as string | undefined;
    if (!code) {
      throw new AppError(400, "Missing authorization code", "OAUTH_MISSING_CODE");
    }

    const userJson =
      typeof req.body?.user === "string" ? req.body.user : undefined;

    const profile = await oauthService.completeAppleOAuth(code, userJson);
    const session = await authService.signInWithOAuthProfile(profile);
    return redirectOAuthSuccess(session.accessToken)(res);
  } catch (err) {
    if (err instanceof AppError) {
      return redirectOAuthError(err.message, err.code)(res);
    }
    return redirectOAuthError("OAuth sign-in failed", "OAUTH_FAILED")(res);
  }
}
