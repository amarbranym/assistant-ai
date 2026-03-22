"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../context/auth-context";
import { fetchCurrentUser } from "../api/auth.api";
import { AUTH_ME_QUERY_KEY } from "../lib/auth-query-keys";
import { getAccessToken } from "../lib/auth-storage";

/**
 * Profile for the current session; keeps React Query cache in sync with `AuthProvider`.
 */
export function useAuthUser() {
  const { user, isReady, isAuthenticated, refetchUser } = useAuth();

  const query = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled:
      isReady && isAuthenticated && Boolean(getAccessToken()),
    staleTime: 60_000,
    retry: false,
  });

  const data = query.data ?? (user ? { user } : undefined);

  return {
    data,
    isLoading:
      !isReady ||
      (isAuthenticated && query.isFetching && !data),
    isError: query.isError,
    refetch: refetchUser,
  };
}
