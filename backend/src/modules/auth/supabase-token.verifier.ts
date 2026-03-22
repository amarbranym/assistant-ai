import jwt from "jsonwebtoken";

import { env } from "../../config/env";

/**
 * Verifies Supabase-issued access tokens (HS256, project JWT secret).
 * @see https://supabase.com/docs/guides/auth/jwt-fields
 */
export type SupabaseAccessTokenPayload = {
  sub: string;
  email: string;
  name?: string;
};

export function verifySupabaseAccessToken(
  token: string
): SupabaseAccessTokenPayload {
  const decoded = jwt.verify(token, env.supabaseJwtSecret, {
    algorithms: ["HS256"],
  }) as jwt.JwtPayload & {
    sub?: string;
    email?: string;
    user_metadata?: { name?: string; full_name?: string };
  };

  if (typeof decoded.sub !== "string") {
    throw new Error("Invalid token subject");
  }

  const email = typeof decoded.email === "string" ? decoded.email : "";
  let name: string | undefined;
  const meta = decoded.user_metadata;
  if (meta && typeof meta === "object") {
    if (typeof meta.name === "string") name = meta.name;
    else if (typeof meta.full_name === "string") name = meta.full_name;
  }

  return { sub: decoded.sub, email, name };
}
