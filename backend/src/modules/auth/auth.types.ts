export type AuthUserDto = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type AuthSessionDto = {
  user: AuthUserDto;
  accessToken: string;
};

export const OAUTH_PROVIDERS = ["google", "github", "apple"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export type NormalizedOAuthProfile = {
  provider: OAuthProvider;
  providerAccountId: string;
  /** Absent for some Apple repeat sign-ins; existing OAuth link is resolved by `providerAccountId`. */
  email?: string;
  name: string;
};
