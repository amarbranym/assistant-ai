import { getPrismaClient } from "../../lib/prismaClient";

const prisma = getPrismaClient();

export async function findProfileById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, createdAt: true }
  });
}

export async function createUserFromSupabaseProfile(data: {
  id: string;
  email: string;
  name: string;
}) {
  return prisma.user.create({
    data: {
      id: data.id,
      email: data.email,
      name: data.name,
      passwordHash: null,
      emailVerifiedAt: new Date()
    },
    select: { id: true, email: true, name: true, createdAt: true }
  });
}
