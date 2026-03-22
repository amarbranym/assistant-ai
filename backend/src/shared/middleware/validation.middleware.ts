import { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validate<TBody>(schema: ZodSchema<TBody>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          issues: result.error.issues
        }
      });
    }

    (req as any).validatedBody = result.data;

    next();
  };
}
