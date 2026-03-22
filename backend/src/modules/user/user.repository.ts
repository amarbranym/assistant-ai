import { getPrismaClient } from "../../lib/prismaClient";

const prisma = getPrismaClient();

export async function findProfileById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, createdAt: true }
  });
}
