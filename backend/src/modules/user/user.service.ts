import type { UserProfileDto } from "./user.types";
import * as userRepository from "./user.repository";

function toDto(row: {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}): UserProfileDto {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.createdAt.toISOString()
  };
}

/**
 * Returns profile row; creates app User on first request (id = Supabase auth user id).
 */
export async function ensureProfileForAuthUser(params: {
  id: string;
  email: string;
  name: string | null | undefined;
}): Promise<UserProfileDto> {
  const existing = await userRepository.findProfileById(params.id);
  if (existing) {
    return toDto(existing);
  }

  const email = params.email.trim().toLowerCase();
  const rawName =
    (typeof params.name === "string" && params.name.trim()) ||
    email.split("@")[0] ||
    "User";
  const name = rawName.slice(0, 120);

  const created = await userRepository.createUserFromSupabaseProfile({
    id: params.id,
    email,
    name
  });
  return toDto(created);
}
