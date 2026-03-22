import { env } from "@/config/env";
import { getAccessToken } from "@/features/auth/lib/auth-storage";

export function getApiBaseUrl(): string {
  return env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
}

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string; code?: string };
};

export type ApiRequestInit = RequestInit & {
  /** Omit `Authorization` and `x-api-key` (e.g. login/register). */
  skipAuth?: boolean;
};

function buildAuthHeaders(skipAuth?: boolean): HeadersInit {
  if (skipAuth) return {};
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const key = env.NEXT_PUBLIC_API_KEY;
  if (key) headers["x-api-key"] = key;
  return headers;
}

/**
 * Calls the backend JSON API and unwraps `{ success, data }`.
 */
export async function apiRequest<T>(
  path: string,
  init?: ApiRequestInit
): Promise<T> {
  const { skipAuth, ...rest } = init ?? {};
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const hasBody = rest.body !== undefined && rest.body !== null;

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...buildAuthHeaders(skipAuth),
        ...(rest.headers ?? {}),
      },
    });
  } catch (e) {
    const base = getApiBaseUrl();
    if (e instanceof TypeError) {
      throw new Error(
        `Cannot reach API at ${base} (${e.message}). Start the backend (e.g. \`npm run dev\` in the backend folder) or fix NEXT_PUBLIC_API_URL in frontend/.env.local.`
      );
    }
    throw e;
  }

  const text = await res.text();
  let parsed: ApiEnvelope<T> | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      throw new Error("Invalid JSON response");
    }
  }

  if (!res.ok) {
    const msg =
      parsed?.error?.message ??
      (typeof parsed === "object" && parsed && "error" in parsed
        ? String((parsed as { error?: { message?: string } }).error?.message)
        : null) ??
      `HTTP ${res.status}`;
    const err = new Error(msg) as Error & { code?: string };
    if (parsed?.error?.code) err.code = parsed.error.code;
    throw err;
  }

  if (parsed && typeof parsed === "object" && "success" in parsed) {
    if (!parsed.success) {
      const err = new Error(parsed.error?.message ?? "Request failed") as Error & {
        code?: string;
      };
      if (parsed.error?.code) err.code = parsed.error.code;
      throw err;
    }
    return parsed.data as T;
  }

  return parsed as T;
}
