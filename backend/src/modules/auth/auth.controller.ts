import type { NextFunction, Request, Response } from "express";
import { created, ok } from "../../common/response/apiResponse";
import * as authService from "./auth.service";
import type { LoginBody, RegisterBody } from "./auth.validation";

export async function register(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const body = req.validatedBody as RegisterBody | undefined;
  if (!body) {
    return res.status(400).json({
      success: false,
      error: { message: "Invalid request body", code: "INVALID_BODY" }
    });
  }

  const session = await authService.registerUser(body);
  return created(res, session);
}

export async function login(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const body = req.validatedBody as LoginBody | undefined;
  if (!body) {
    return res.status(400).json({
      success: false,
      error: { message: "Invalid request body", code: "INVALID_BODY" }
    });
  }

  const session = await authService.loginUser(body);
  return ok(res, session);
}

export async function logout(
  _req: unknown,
  res: Response,
  _next: NextFunction
) {
  return ok(res, { ok: true });
}
