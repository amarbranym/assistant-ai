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
          code: "VALIDATION_ERROR",
          details: result.error.issues
        }
      });
    }

    req.validatedBody = result.data;
    next();
  };
}
