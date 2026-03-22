import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type AccessTokenPayload = {
  sub: string;
  email: string;
};

export function signAccessToken(userId: string, email: string): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
    algorithm: "HS256"
  };
  return jwt.sign({ sub: userId, email }, env.jwtSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload & {
    sub?: string;
    email?: string;
  };
  if (typeof decoded.sub !== "string") {
    throw new Error("Invalid token subject");
  }
  return {
    sub: decoded.sub,
    email: typeof decoded.email === "string" ? decoded.email : ""
  };
}
