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

  databaseUrl: requireEnv("DATABASE_URL"),
  upstashRedisRestUrl: requireEnv("UPSTASH_REDIS_REST_URL"),
  upstashRedisRestToken: requireEnv("UPSTASH_REDIS_REST_TOKEN"),

  openaiApiKey: process.env.OPENAI_API_KEY,
  googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  deepgramApiKey: process.env.DEEPGRAM_API_KEY,
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,

  logLevel: process.env.LOG_LEVEL || "info"
} as const;

export const isProd = env.nodeEnv === "production";
export const isDev = env.nodeEnv === "development";
