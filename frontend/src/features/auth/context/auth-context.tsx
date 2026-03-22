"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  startTransition,
  type ReactNode,
} from "react";

import {
  createBrowserSupabaseClient,
  isSupabaseEnvConfigured,
} from "@/lib/supabase/client";

import { fetchCurrentUser } from "../api/auth.api";
import { AUTH_ME_QUERY_KEY } from "../lib/auth-query-keys";
import { clearAccessToken, getAccessToken } from "../lib/auth-storage";
import {
  authUserFromSession,
  persistAccessTokenFromSession,
} from "../lib/session-sync";
import type { AuthUser } from "../types/auth-api.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type AuthStatus = "bootstrapping" | "ready";

type AuthContextValue = {
  supabase: SupabaseClient | null;
  user: AuthUser | null;
  status: AuthStatus;
  /** True once Supabase client + initial session sync has finished (or env is missing). */
  isReady: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    isSupabaseEnvConfigured() ? "bootstrapping" : "ready"
  );

  useEffect(() => {
    if (!isSupabaseEnvConfigured()) {
      return;
    }

    const raw = createBrowserSupabaseClient();
    if (!raw) {
      startTransition(() => setStatus("ready"));
      return;
    }

    const supabaseClient: SupabaseClient = raw;
    startTransition(() => setSupabase(supabaseClient));

    let cancelled = false;

    async function syncFromSession() {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (cancelled) return;
      persistAccessTokenFromSession(session);
      startTransition(() => {
        setUser(authUserFromSession(session));
        setStatus("ready");
      });
    }

    void syncFromSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      persistAccessTokenFromSession(session);
      const nextUser = authUserFromSession(session);
      startTransition(() => {
        if (nextUser) {
          setUser(nextUser);
        } else {
          setUser(null);
          queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
        }
        setStatus("ready");
      });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearAccessToken();
    setUser(null);
    queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY });
    setStatus("ready");
  }, [supabase, queryClient]);

  const refetchUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const me = await fetchCurrentUser();
      setUser(me.user);
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, me);
    } catch {
      await signOut();
    }
  }, [queryClient, signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      supabase,
      user,
      status,
      isReady: status === "ready",
      isAuthenticated: Boolean(user),
      signOut,
      refetchUser,
    }),
    [supabase, user, status, signOut, refetchUser]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
