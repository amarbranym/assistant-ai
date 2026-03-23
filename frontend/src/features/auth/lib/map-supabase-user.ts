import type { User } from "@supabase/supabase-js";

import type { AuthUser } from "../types/auth-api.types";

export function mapSupabaseUserToAuthUser(u: User): AuthUser {
  const meta = u.user_metadata as
    | { name?: string; full_name?: string; avatar_url?: string; picture?: string }
    | undefined;
  const name =
    (typeof meta?.name === "string" && meta.name.trim()) ||
    (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
    u.email?.split("@")[0] ||
    "User";
  const avatarUrl =
    (typeof meta?.avatar_url === "string" && meta.avatar_url.trim()) ||
    (typeof meta?.picture === "string" && meta.picture.trim()) ||
    null;

  return {
    id: u.id,
    email: u.email ?? "",
    name: name.slice(0, 120),
    avatarUrl,
    createdAt: u.created_at ?? new Date().toISOString(),
  };
}
