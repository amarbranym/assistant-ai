"use client";

import { isSupabaseEnvConfigured } from "@/lib/supabase/config";

export function SupabaseEnvBanner() {
  if (isSupabaseEnvConfigured()) return null;

  return (
    <div
      className="border-border bg-muted/50 text-muted-foreground rounded-md border p-3 text-xs leading-snug"
      role="status"
    >
      Supabase is not configured. Add{" "}
      <code className="text-foreground">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
      <code className="text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
      <code className="text-foreground">.env.local</code>, then restart the dev server.
    </div>
  );
}
