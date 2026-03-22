import { apiRequest } from "@/lib/api/client";

import type { AuthUser } from "../types/auth-api.types";

const BASE = "/api/v1/auth";

export async function fetchCurrentUser(): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>(`${BASE}/me`, { method: "GET" });
}
