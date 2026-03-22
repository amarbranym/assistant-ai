import type { NextFunction, Response } from "express";
import { ok } from "../../common/response/apiResponse";
import type { RequestWithUser } from "../../common/interfaces/request.interface";
import * as userService from "./user.service";

export async function me(
  req: RequestWithUser,
  res: Response,
  _next: NextFunction
) {
  const u = req.user!;
  const user = await userService.ensureProfileForAuthUser({
    id: u.id,
    email: u.email ?? "",
    name: u.name
  });
  return ok(res, { user });
}
