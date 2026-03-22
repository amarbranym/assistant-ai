/** Must match `src/config/env.ts` preprocess fallbacks — not real credentials. */
export const SUPABASE_PLACEHOLDER_URL = "https://placeholder.supabase.co";
export const SUPABASE_PLACEHOLDER_ANON_KEY = "anon-placeholder";

export type SupabasePublicCredentials = {
  url: string;
  anonKey: string;
};

/**
 * True when real Supabase URL + anon key are set (browser or server).
 * Use before creating clients; avoids crashes when `.env.local` is incomplete.
 */
export function isSupabaseEnvConfigured(): boolean {
  return getSupabasePublicCredentials() !== null;
}

/**
 * Returns trimmed URL + anon key, or `null` if unset or still placeholder values.
 * Single source of truth for all Supabase browser/server/middleware clients.
 */
export function getSupabasePublicCredentials(): SupabasePublicCredentials | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  if (url === SUPABASE_PLACEHOLDER_URL || anonKey === SUPABASE_PLACEHOLDER_ANON_KEY) {
    return null;
  }
  return { url, anonKey };
}
