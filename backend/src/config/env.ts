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

function optionalEnv(key: string, fallback = ""): string {
  const raw = process.env[key];
  const value = typeof raw === "string" ? raw.trim() : "";
  return value || fallback;
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseInteger(value: string, fallback: number): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const v = value.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return fallback;
}

const nodeEnv = (process.env.NODE_ENV || "development") as NodeEnv;

export const env = {
  nodeEnv,
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

  /** Comma-separated list of allowed browser origins. Empty → allow only same-origin / server-to-server. */
  corsAllowedOrigins: parseCsv(
    optionalEnv(
      "CORS_ALLOWED_ORIGINS",
      nodeEnv === "production" ? "" : "http://localhost:3000,http://127.0.0.1:3000"
    )
  ),

  /**
   * When `true`, missing/invalid `Authorization` headers fall back to a shared dev user.
   * Defaults to `false` in production to prevent accidental exposure.
   */
  allowDevAuthFallback: parseBool(
    process.env.ALLOW_DEV_AUTH_FALLBACK,
    nodeEnv !== "production"
  ),

  /** Outbound fetch timeout (ms) for custom-api and managed integration tools. */
  toolFetchTimeoutMs: parseInteger(
    optionalEnv("TOOL_FETCH_TIMEOUT_MS", "15000"),
    15_000
  ),

  /** When `true`, outbound tool fetches may target private/loopback addresses (dev only). */
  allowPrivateToolTargets: parseBool(
    process.env.ALLOW_PRIVATE_TOOL_TARGETS,
    nodeEnv !== "production"
  ),

  /**
   * Provider keys — required only when the corresponding feature is used.
   * We warn loudly at boot in non-prod, and list missing ones so operators
   * know the server will fail on first request that needs them.
   */
  providers: {
    openaiApiKey: optionalEnv("OPENAI_API_KEY"),
    googleGenerativeAiApiKey: optionalEnv("GOOGLE_GENERATIVE_AI_API_KEY"),
    groqApiKey: optionalEnv("GROQ_API_KEY"),
    deepgramApiKey: optionalEnv("DEEPGRAM_API_KEY"),
    elevenlabsApiKey: optionalEnv("ELEVENLABS_API_KEY"),
  }
} as const;

export const isProd = env.nodeEnv === "production";
export const isDev = env.nodeEnv === "development";

/**
 * Logs a single warning listing provider keys that are missing.
 * Callers (e.g. server bootstrap) should invoke this once after pino is ready.
 */
export function checkProviderConfig(log: {
  warn: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
}): void {
  const missing: string[] = [];
  if (
    !env.providers.openaiApiKey &&
    !env.providers.googleGenerativeAiApiKey &&
    !env.providers.groqApiKey
  ) {
    missing.push(
      "OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GROQ_API_KEY (at least one)"
    );
  }
  if (!env.providers.deepgramApiKey) missing.push("DEEPGRAM_API_KEY");
  if (!env.providers.elevenlabsApiKey) missing.push("ELEVENLABS_API_KEY");
  if (missing.length === 0) return;
  const payload = {
    missing,
    nodeEnv: env.nodeEnv,
    hint:
      "Voice/LLM calls will fail at runtime with a clear error. Add keys to backend/.env to enable."
  };
  if (isProd) {
    log.error(payload, "Provider API keys missing in production");
  } else {
    log.warn(payload, "Provider API keys missing (non-prod)");
  }
}
