import { getPrismaClient } from "../../lib/prismaClient";
import type { OAuthProvider } from "./auth.types";

const prisma = getPrismaClient();

export async function createUserWithCredentials(data: {
  email: string;
  passwordHash: string;
  name: string;
}) {
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name
    }
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findOAuthAccountWithUser(
  provider: OAuthProvider,
  providerAccountId: string
) {
  return prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: { provider, providerAccountId }
    },
    include: { user: true }
  });
}

export async function createUserWithOAuth(data: {
  email: string;
  name: string;
  provider: OAuthProvider;
  providerAccountId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: null
      }
    });
    await tx.oAuthAccount.create({
      data: {
        userId: user.id,
        provider: data.provider,
        providerAccountId: data.providerAccountId
      }
    });
    return user;
  });
}

export async function linkOAuthAccount(data: {
  userId: string;
  provider: OAuthProvider;
  providerAccountId: string;
}) {
  return prisma.oAuthAccount.create({
    data: {
      userId: data.userId,
      provider: data.provider,
      providerAccountId: data.providerAccountId
    }
  });
}
