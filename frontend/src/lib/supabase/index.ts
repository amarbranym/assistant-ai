/**
 * Supabase infrastructure: env checks, clients, and Next.js middleware integration.
 */
export {
  getSupabasePublicCredentials,
  isSupabaseEnvConfigured,
  SUPABASE_PLACEHOLDER_ANON_KEY,
  SUPABASE_PLACEHOLDER_URL,
  type SupabasePublicCredentials,
} from "./config";
export { createBrowserSupabaseClient } from "./client";
export { createServerSupabaseClient } from "./server";
export { handleSupabaseAuthMiddleware } from "./middleware";
