import { env } from "@/config/env";

export function getApiBaseUrl(): string {
  return env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
}

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

function authHeaders(): HeadersInit {
  return { "x-api-key": env.NEXT_PUBLIC_API_KEY };
}

/**
 * Calls the backend JSON API and unwraps `{ success, data }`.
 */
export async function apiRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const hasBody = init?.body !== undefined && init?.body !== null;

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  });

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
    throw new Error(msg);
  }

  if (parsed && typeof parsed === "object" && "success" in parsed) {
    if (!parsed.success) {
      throw new Error(parsed.error?.message ?? "Request failed");
    }
    return parsed.data as T;
  }

  return parsed as T;
}
