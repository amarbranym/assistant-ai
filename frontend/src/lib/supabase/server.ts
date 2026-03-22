import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicCredentials } from "./config";

export async function createServerSupabaseClient() {
  const creds = getSupabasePublicCredentials();
  if (!creds) {
    throw new Error(
      "Supabase is not configured (set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    creds.url,
    creds.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
