/**
 * Placeholder for an optional Supabase client.
 * Add `@supabase/supabase-js`, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then export `createClient` here.
 */
export const isSupabaseConfigured = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);
