import type { Session } from "@supabase/supabase-js";

import type { AuthUser } from "../types/auth-api.types";
import { clearAccessToken, setAccessToken } from "./auth-storage";
import { mapSupabaseUserToAuthUser } from "./map-supabase-user";

/** Keeps API `Authorization` in sync with the Supabase session. */
export function persistAccessTokenFromSession(session: Session | null): void {
  if (session?.access_token) {
    setAccessToken(session.access_token);
  } else {
    clearAccessToken();
  }
}

export function authUserFromSession(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  return mapSupabaseUserToAuthUser(session.user);
}
