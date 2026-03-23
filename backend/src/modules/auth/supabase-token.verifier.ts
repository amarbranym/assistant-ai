import jwt from "jsonwebtoken";
import {
  createRemoteJWKSet,
  decodeJwt,
  decodeProtectedHeader,
  jwtVerify,
  type JWTPayload,
} from "jose";

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

type TokenPayload = JWTPayload & {
  sub?: string;
  email?: string;
  user_metadata?: { name?: string; full_name?: string };
};

const jwksByIssuer = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function issuerJwks(issuer: string) {
  const normalized = issuer.replace(/\/$/, "");
  const existing = jwksByIssuer.get(normalized);
  if (existing) return existing;
  const jwks = createRemoteJWKSet(
    new URL(`${normalized}/.well-known/jwks.json`)
  );
  jwksByIssuer.set(normalized, jwks);
  return jwks;
}

function mapPayload(decoded: TokenPayload): SupabaseAccessTokenPayload {
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

export async function verifySupabaseAccessToken(
  token: string
): Promise<SupabaseAccessTokenPayload> {
  const header = decodeProtectedHeader(token);
  const alg = header.alg;

  if (alg === "HS256") {
    const decoded = jwt.verify(token, env.supabaseJwtSecret, {
      algorithms: ["HS256"],
    }) as TokenPayload;
    return mapPayload(decoded);
  }

  const payload = decodeJwt(token);
  if (typeof payload.iss !== "string" || payload.iss.length === 0) {
    throw new Error("Missing token issuer");
  }

  const { payload: verified } = await jwtVerify(token, issuerJwks(payload.iss), {
    algorithms: alg ? [alg] : undefined,
    issuer: payload.iss,
  });

  return mapPayload(verified as TokenPayload);
}
