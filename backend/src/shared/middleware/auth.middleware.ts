import { NextFunction, Response } from "express";
import type { RequestWithUser } from "../types/common.types";

export function authMiddleware(
  req: RequestWithUser,
  _res: Response,
  next: NextFunction
) {
  const apiKey = req.headers["x-api-key"];

  if (typeof apiKey === "string" && apiKey.length > 0) {
    req.user = {
      id: "demo-user",
      email: "demo-user@example.com",
      role: "admin"
    };
  }

  next();
}
