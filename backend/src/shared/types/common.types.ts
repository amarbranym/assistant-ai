import type { Request } from "express";

export interface UserContext {
  id: string;
  email?: string;
  role?: string;
}

export interface RequestWithUser extends Request {
  user?: UserContext;
}

export interface ValidatedRequest<TBody> extends RequestWithUser {
  validatedBody: TBody;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: UserContext;
    // populated by validation middleware
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validatedBody?: any;
  }
}
