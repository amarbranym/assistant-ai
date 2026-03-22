"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchCurrentUser } from "../api/auth.api";
import { getAccessToken } from "../lib/auth-storage";

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

export function useAuthUser() {
  return useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled: typeof window !== "undefined" && !!getAccessToken(),
    staleTime: 60_000,
    retry: false,
  });
}
