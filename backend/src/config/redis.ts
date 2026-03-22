import { Redis } from "@upstash/redis";
import { env } from "./env";

export const redis = new Redis({
  url: env.upstashRedisRestUrl,
  token: env.upstashRedisRestToken
});

export async function getJson<T>(key: string): Promise<T | null> {
  const value = await redis.get<string>(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function setJson<T>(
  key: string,
  value: T,
  options?: { ex?: number }
): Promise<void> {
  const payload = JSON.stringify(value);
  if (options?.ex) {
    await redis.set(key, payload, { ex: options.ex });
  } else {
    await redis.set(key, payload);
  }
}
