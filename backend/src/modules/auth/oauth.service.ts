import * as jose from "jose";
import { env } from "../../config/env";
import { AppError } from "../../common/errors/AppError";
import type { NormalizedOAuthProfile, OAuthProvider } from "./auth.types";

function apiPublicBase(): string {
  return env.apiPublicUrl || `http://localhost:${env.port}`;
}

function redirectUri(provider: "google" | "github"): string {
  return `${apiPublicBase()}/api/v1/auth/oauth/${provider}/callback`;
}

function appleRedirectUri(): string {
  return `${apiPublicBase()}/api/v1/auth/oauth/apple/callback`;
}

export function assertGoogleOAuthConfigured(): void {
  if (!env.googleOAuthClientId || !env.googleOAuthClientSecret) {
    throw new AppError(503, "Google OAuth is not configured", "OAUTH_NOT_CONFIGURED");
  }
}

export function assertGitHubOAuthConfigured(): void {
  if (!env.githubOAuthClientId || !env.githubOAuthClientSecret) {
    throw new AppError(503, "GitHub OAuth is not configured", "OAUTH_NOT_CONFIGURED");
  }
}

export function assertAppleOAuthConfigured(): void {
  if (
    !env.appleOAuthClientId ||
    !env.appleOAuthTeamId ||
    !env.appleOAuthKeyId ||
    (!env.appleOAuthPrivateKey && !env.appleOAuthPrivateKeyBase64)
  ) {
    throw new AppError(503, "Apple OAuth is not configured", "OAUTH_NOT_CONFIGURED");
  }
}

function applePrivateKeyPem(): string {
  if (env.appleOAuthPrivateKeyBase64) {
    return Buffer.from(env.appleOAuthPrivateKeyBase64, "base64").toString("utf8");
  }
  return env.appleOAuthPrivateKey.replace(/\\n/g, "\n");
}

const appleJWKS = jose.createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys")
);

async function signAppleClientSecret(): Promise<string> {
  const pk = applePrivateKeyPem();
  const key = await jose.importPKCS8(pk, "ES256");
  const now = Math.floor(Date.now() / 1000);
  return new jose.SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: env.appleOAuthKeyId })
    .setIssuer(env.appleOAuthTeamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60 * 24 * 30)
    .setAudience("https://appleid.apple.com")
    .setSubject(env.appleOAuthClientId)
    .sign(key);
}

export function buildGoogleAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.googleOAuthClientId,
    redirect_uri: redirectUri("google"),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account"
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function completeGoogleOAuth(
  code: string
): Promise<NormalizedOAuthProfile> {
  const body = new URLSearchParams({
    code,
    client_id: env.googleOAuthClientId,
    client_secret: env.googleOAuthClientSecret,
    redirect_uri: redirectUri("google"),
    grant_type: "authorization_code"
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!tokenRes.ok) {
    throw new AppError(502, "Google token exchange failed", "OAUTH_UPSTREAM");
  }

  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) {
    throw new AppError(502, "Google token response invalid", "OAUTH_UPSTREAM");
  }

  const uiRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });

  if (!uiRes.ok) {
    throw new AppError(502, "Google userinfo failed", "OAUTH_UPSTREAM");
  }

  const u = (await uiRes.json()) as {
    sub?: string;
    email?: string;
    name?: string;
  };

  if (!u.sub || !u.email) {
    throw new AppError(502, "Google profile incomplete", "OAUTH_UPSTREAM");
  }

  return {
    provider: "google",
    providerAccountId: u.sub,
    email: u.email,
    name: (u.name && u.name.trim()) || u.email.split("@")[0]
  };
}

export function buildGitHubAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.githubOAuthClientId,
    redirect_uri: redirectUri("github"),
    scope: "read:user user:email",
    state
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function completeGitHubOAuth(
  code: string
): Promise<NormalizedOAuthProfile> {
  const body = new URLSearchParams({
    client_id: env.githubOAuthClientId,
    client_secret: env.githubOAuthClientSecret,
    code,
    redirect_uri: redirectUri("github")
  });

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!tokenRes.ok) {
    throw new AppError(502, "GitHub token exchange failed", "OAUTH_UPSTREAM");
  }

  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) {
    throw new AppError(502, "GitHub token response invalid", "OAUTH_UPSTREAM");
  }

  const authHeader = { Authorization: `Bearer ${tokens.access_token}` };

  const userRes = await fetch("https://api.github.com/user", {
    headers: { ...authHeader, "User-Agent": "assistant-ai-backend" }
  });

  if (!userRes.ok) {
    throw new AppError(502, "GitHub user profile failed", "OAUTH_UPSTREAM");
  }

  const u = (await userRes.json()) as {
    id?: number;
    email?: string | null;
    name?: string | null;
    login?: string;
  };

  if (u.id == null) {
    throw new AppError(502, "GitHub profile incomplete", "OAUTH_UPSTREAM");
  }

  let email = (u.email && u.email.trim().toLowerCase()) || "";

  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: { ...authHeader, "User-Agent": "assistant-ai-backend" }
    });
    if (emailsRes.ok) {
      const list = (await emailsRes.json()) as {
        email?: string;
        primary?: boolean;
        verified?: boolean;
      }[];
      const primary =
        list.find((e) => e.primary && e.verified) ||
        list.find((e) => e.verified);
      email = (primary?.email || "").trim().toLowerCase();
    }
  }

  if (!email) {
    throw new AppError(
      400,
      "GitHub did not expose a verified email. Make one public or grant user:email scope.",
      "OAUTH_EMAIL_REQUIRED"
    );
  }

  const name =
    (u.name && u.name.trim()) || (u.login && u.login.trim()) || email.split("@")[0];

  return {
    provider: "github",
    providerAccountId: String(u.id),
    email,
    name
  };
}

export function buildAppleAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.appleOAuthClientId,
    redirect_uri: appleRedirectUri(),
    response_type: "code",
    scope: "name email",
    response_mode: "form_post",
    state
  });
  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
}

export async function completeAppleOAuth(
  code: string,
  userFirstSignInJson: string | undefined
): Promise<NormalizedOAuthProfile> {
  const clientSecret = await signAppleClientSecret();
  const body = new URLSearchParams({
    client_id: env.appleOAuthClientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: appleRedirectUri()
  });

  const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!tokenRes.ok) {
    throw new AppError(502, "Apple token exchange failed", "OAUTH_UPSTREAM");
  }

  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) {
    throw new AppError(502, "Apple token response invalid", "OAUTH_UPSTREAM");
  }

  const { payload } = await jose.jwtVerify(tokens.id_token, appleJWKS, {
    issuer: "https://appleid.apple.com",
    audience: env.appleOAuthClientId
  });

  const sub = payload.sub as string;
  let email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";

  let name = email ? email.split("@")[0] : "User";
  if (userFirstSignInJson) {
    try {
      const parsed = JSON.parse(userFirstSignInJson) as {
        name?: { firstName?: string; lastName?: string };
      };
      const fn = parsed.name?.firstName || "";
      const ln = parsed.name?.lastName || "";
      const combined = `${fn} ${ln}`.trim();
      if (combined) name = combined;
    } catch {
      /* ignore */
    }
  }

  return {
    provider: "apple",
    providerAccountId: sub,
    ...(email ? { email } : {}),
    name: email ? name : name || "User"
  };
}

export function assertCallbackProvider(
  expected: OAuthProvider,
  fromState: string
): void {
  if (fromState !== expected) {
    throw new AppError(400, "OAuth state provider mismatch", "OAUTH_STATE_MISMATCH");
  }
}
