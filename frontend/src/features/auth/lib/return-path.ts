import { DEFAULT_POST_AUTH_PATH } from "../constants";

/**
 * Prevents open redirects: only same-origin relative paths are allowed.
 * Rejects `//evil.com`, `https://…`, and protocol-relative URLs.
 */
export function sanitizeReturnPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_POST_AUTH_PATH
): string {
  if (next == null || typeof next !== "string") return fallback;
  const t = next.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  if (t.includes("://") || t.includes("\\")) return fallback;
  return t;
}
