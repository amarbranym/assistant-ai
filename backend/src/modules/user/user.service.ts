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

export async function getProfileById(userId: string): Promise<UserProfileDto | null> {
  const row = await userRepository.findProfileById(userId);
  return row ? toDto(row) : null;
}
