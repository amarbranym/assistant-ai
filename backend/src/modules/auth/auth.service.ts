import { Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/AppError";
import { signAccessToken } from "../../utils/jwt";
import { hashPassword, verifyPassword } from "../../utils/password";
import type { AuthSessionDto, AuthUserDto, NormalizedOAuthProfile } from "./auth.types";
import * as authRepository from "./auth.repository";

function toUserDto(row: {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}): AuthUserDto {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.createdAt.toISOString()
  };
}

function sessionForUser(user: {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}): AuthSessionDto {
  return {
    user: toUserDto(user),
    accessToken: signAccessToken(user.id, user.email)
  };
}

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthSessionDto> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await authRepository.createUserWithCredentials({
      email: normalizedEmail,
      passwordHash,
      name: input.name.trim()
    });
    return sessionForUser(user);
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw new AppError(
        409,
        "An account with this email already exists",
        "EMAIL_IN_USE"
      );
    }
    throw e;
  }
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthSessionDto> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await authRepository.findUserByEmail(normalizedEmail);

  if (!user) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (!user.passwordHash) {
    throw new AppError(
      401,
      "This account uses social sign-in. Use Google, GitHub, or Apple.",
      "USE_OAUTH"
    );
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  return sessionForUser(user);
}

/**
 * Finds or creates a user from an IdP profile and returns an app JWT session.
 */
export async function signInWithOAuthProfile(
  profile: NormalizedOAuthProfile
): Promise<AuthSessionDto> {
  const linked = await authRepository.findOAuthAccountWithUser(
    profile.provider,
    profile.providerAccountId
  );
  if (linked?.user) {
    return sessionForUser(linked.user);
  }

  const emailRaw = profile.email?.trim().toLowerCase();
  if (!emailRaw) {
    throw new AppError(
      400,
      "Your provider did not return an email and no existing account was found for this sign-in. If you already registered with Apple, sign in with the same Apple ID again.",
      "OAUTH_EMAIL_REQUIRED"
    );
  }

  const byEmail = await authRepository.findUserByEmail(emailRaw);
  if (byEmail) {
    try {
      await authRepository.linkOAuthAccount({
        userId: byEmail.id,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new AppError(
          409,
          "This social account is already linked to another user",
          "OAUTH_ACCOUNT_TAKEN"
        );
      }
      throw e;
    }
    return sessionForUser(byEmail);
  }

  const user = await authRepository.createUserWithOAuth({
    email: emailRaw,
    name: profile.name.trim() || emailRaw.split("@")[0],
    provider: profile.provider,
    providerAccountId: profile.providerAccountId
  });

  return sessionForUser(user);
}
