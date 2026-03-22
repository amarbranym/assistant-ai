import type { Request } from "express";

export interface UserContext {
  id: string;
  email?: string;
  role?: string;
}

export interface RequestWithUser extends Request {
  user?: UserContext;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: UserContext;
    validatedBody?: unknown;
  }
}

export {};
