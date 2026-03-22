import { apiRequest } from "@/lib/api/client";

import type { AuthSession, AuthUser } from "../types/auth-api.types";
import { clearAccessToken, setAccessToken } from "../lib/auth-storage";

const BASE = "/api/v1/auth";

export async function registerUser(body: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthSession> {
  return apiRequest<AuthSession>(`${BASE}/register`, {
    method: "POST",
    body: JSON.stringify(body),
    skipAuth: true,
  });
}

export async function loginUser(body: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  return apiRequest<AuthSession>(`${BASE}/login`, {
    method: "POST",
    body: JSON.stringify(body),
    skipAuth: true,
  });
}

export async function logoutUser(): Promise<void> {
  try {
    await apiRequest<{ ok: boolean }>(`${BASE}/logout`, {
      method: "POST",
      body: JSON.stringify({}),
      skipAuth: true,
    });
  } finally {
    clearAccessToken();
    await clearSessionCookie();
  }
}

export async function fetchCurrentUser(): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>(`${BASE}/me`, { method: "GET" });
}

/** Persists JWT for Next middleware (httpOnly cookie on the app origin). */
export async function persistSessionCookie(accessToken: string): Promise<void> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
    credentials: "same-origin",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to persist session");
  }
}

export async function clearSessionCookie(): Promise<void> {
  await fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "same-origin",
  });
}

export function persistAccessToken(session: AuthSession): void {
  setAccessToken(session.accessToken);
}
