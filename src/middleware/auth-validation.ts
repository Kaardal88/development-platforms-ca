import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(50, "Username must not exceed 50 characters"),
  email: z.email("Email must be a valid email").trim(),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
      "Password must be at least 8 characters long and include uppercase, lowercase, number, and a special character"
    ),
});

export function validateRegistration(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.issues.map((issue) => issue.message),
    });
  }
  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const loginSchema = z.object({
    email: z.email("Email must be a valid email"),
    password: z.string().min(1, "Password is required"),
  });
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.issues.map((issue) => issue.message),
    });
  }
  next();
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists
  if (!authHeader) {
    return res.status(401).json({
      error: "Access token required",
    });
  }

  // Check if header follows Bearer format
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Token must be in format: Bearer <token>",
    });
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.substring(7);

  // Verify the token
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(403).json({
      error: "Invalid or expired token",
    });
  }

  // Add user info to request object
  req.user = { id: payload.userId };
  next();
}
