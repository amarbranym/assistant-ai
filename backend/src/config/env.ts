import path from "path";

import dotenv from "dotenv";

// Resolve `backend/.env` from this file so startup works even if cwd is not `backend/`.
const backendRootEnv = path.resolve(__dirname, "../../.env");
dotenv.config({ path: backendRootEnv });
dotenv.config();

type NodeEnv = "development" | "test" | "production";

function requireEnv(key: string, hint?: string): string {
  const raw = process.env[key];
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    const where = hint ? ` ${hint}` : "";
    throw new Error(
      `Missing required environment variable: ${key}.${where} Set it in backend/.env (see backend/.env.example).`
    );
  }
  return value;
}

export const env = {
  nodeEnv: (process.env.NODE_ENV || "development") as NodeEnv,
  port: Number(process.env.PORT) || 4000,

  /** Supabase project JWT secret. Used to verify Auth access tokens (HS256). */
  supabaseJwtSecret: requireEnv(
    "SUPABASE_JWT_SECRET",
    "Copy from Supabase → Project Settings → API → JWT Secret (not the anon key)."
  ),

  databaseUrl: requireEnv("DATABASE_URL"),
  upstashRedisRestUrl: requireEnv("UPSTASH_REDIS_REST_URL"),
  upstashRedisRestToken: requireEnv("UPSTASH_REDIS_REST_TOKEN"),

  logLevel: process.env.LOG_LEVEL || "info",
} as const;

export const isProd = env.nodeEnv === "production";
export const isDev = env.nodeEnv === "development";
