import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicCredentials } from "./config";

let singleton: SupabaseClient | undefined;

/**
 * Browser-only Supabase client (safe for Client Components).
 * Returns `null` when env is missing or still using placeholder values — never throws.
 */
export function createBrowserSupabaseClient(): SupabaseClient | null {
  if (typeof window === "undefined") {
    return null;
  }
  const creds = getSupabasePublicCredentials();
  if (!creds) {
    return null;
  }
  if (!singleton) {
    singleton = createBrowserClient(creds.url, creds.anonKey);
  }
  return singleton;
}

export {
  getSupabasePublicCredentials,
  isSupabaseEnvConfigured,
} from "./config";
