import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();

export function generateToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch (error) {
    return null;
  }
}
