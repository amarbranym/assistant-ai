import { randomBytes } from "crypto";
import { redis } from "../../config/redis";
import { AppError } from "../../common/errors/AppError";

const PREFIX = "oauth:st:";
const TTL_SEC = 600;

export async function issueOAuthState(provider: string): Promise<string> {
  const state = randomBytes(32).toString("hex");
  await redis.set(`${PREFIX}${state}`, provider, { ex: TTL_SEC });
  return state;
}

export async function consumeOAuthState(
  state: string | undefined
): Promise<string> {
  if (!state || typeof state !== "string") {
    throw new AppError(400, "Missing state", "OAUTH_INVALID_STATE");
  }
  const key = `${PREFIX}${state}`;
  const provider = await redis.get<string>(key);
  if (!provider || typeof provider !== "string") {
    throw new AppError(400, "Invalid or expired state", "OAUTH_INVALID_STATE");
  }
  await redis.del(key);
  return provider;
}
