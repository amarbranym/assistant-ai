import type { NextFunction, Response } from "express";
import { error, ok } from "../../common/response/apiResponse";
import type { RequestWithUser } from "../../common/interfaces/request.interface";
import * as userService from "./user.service";

export async function me(
  req: RequestWithUser,
  res: Response,
  _next: NextFunction
) {
  const user = await userService.getProfileById(req.user!.id);
  if (!user) {
    return error(res, 404, {
      message: "User not found",
      code: "USER_NOT_FOUND"
    });
  }
  return ok(res, { user });
}
