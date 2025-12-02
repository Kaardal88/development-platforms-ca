import { z } from "zod";
import { Request, Response, NextFunction } from "express";

const requiredUserDataSchema = z.object({
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(50, "Username must not exceed 50 characters"),
  email: z.email("Email must be a valid email"),
});

const userIdSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a positive number"),
});

const partialUserDataSchema = z.object({
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(50, "Username must not exceed 50 characters")
    .optional(),
  email: z.string("Email must be a valid email").optional(),
});

export const validateUserId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = userIdSchema.safeParse(req.params);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.issues.map((issue) => issue.message),
    });
  }

  next();
};

export const validateRequiredUserData = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = requiredUserDataSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.issues.map((issue) => issue.message),
    });
  }
  next();
};

export const validatePartialUserData = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = partialUserDataSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.issues.map((issue) => issue.message),
    });
  }

  next();
};
