import dotenv from "dotenv";

dotenv.config();

type NodeEnv = "development" | "test" | "production";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: (process.env.NODE_ENV || "development") as NodeEnv,
  port: Number(process.env.PORT) || 4000,

  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptCost: Math.min(
    14,
    Math.max(10, Number(process.env.BCRYPT_COST) || 12)
  ),

  databaseUrl: requireEnv("DATABASE_URL"),
  upstashRedisRestUrl: requireEnv("UPSTASH_REDIS_REST_URL"),
  upstashRedisRestToken: requireEnv("UPSTASH_REDIS_REST_TOKEN"),

  openaiApiKey: process.env.OPENAI_API_KEY,
  googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  deepgramApiKey: process.env.DEEPGRAM_API_KEY,
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,

  logLevel: process.env.LOG_LEVEL || "info",

  /**
   * Public API origin (no trailing slash). Used to build OAuth redirect_uri values.
   * Example: https://api.example.com or http://localhost:4000
   */
  apiPublicUrl: (process.env.API_PUBLIC_URL || "").replace(/\/$/, ""),

  /**
   * Where the browser is sent after OAuth succeeds. Fragment will carry tokens:
   * `#access_token=<jwt>&token_type=Bearer`
   */
  frontendOAuthSuccessUrl: (
    process.env.FRONTEND_OAUTH_SUCCESS_URL || "http://localhost:3000/auth/oauth/callback"
  ).replace(/\/$/, ""),

  googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
  googleOAuthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",

  githubOAuthClientId: process.env.GITHUB_OAUTH_CLIENT_ID || "",
  githubOAuthClientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET || "",

  appleOAuthClientId: process.env.APPLE_OAUTH_CLIENT_ID || "",
  appleOAuthTeamId: process.env.APPLE_OAUTH_TEAM_ID || "",
  appleOAuthKeyId: process.env.APPLE_OAUTH_KEY_ID || "",
  /** PEM contents; use literal \n in .env or APPLE_OAUTH_PRIVATE_KEY_BASE64 */
  appleOAuthPrivateKey: process.env.APPLE_OAUTH_PRIVATE_KEY || "",
  appleOAuthPrivateKeyBase64: process.env.APPLE_OAUTH_PRIVATE_KEY_BASE64 || ""
} as const;

export const isProd = env.nodeEnv === "production";
export const isDev = env.nodeEnv === "development";
