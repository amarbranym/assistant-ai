/** User-facing copy when public Supabase env vars are missing. */
export const SUPABASE_ENV_MISSING_MESSAGE =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

/** Default `next` target after sign-in when no safe path is provided. */
export const DEFAULT_POST_AUTH_PATH = "/assistants" as const;

/** Shown after `signUp` when Supabase returns no session (email confirmation required). */
export const SIGNUP_CHECK_EMAIL_MESSAGE =
  "Check your email to confirm your account, then sign in." as const;

/** Shown after `resetPasswordForEmail` succeeds. */
export const PASSWORD_RESET_EMAIL_SENT_MESSAGE =
  "If that email exists, we sent a password reset link." as const;

/** Shown after `updateUser({ password })` succeeds on recovery session. */
export const PASSWORD_UPDATED_MESSAGE =
  "Your password was updated. You can now sign in." as const;

/** Minimum password length enforced in the UI (align with Supabase project settings). */
export const MIN_PASSWORD_LENGTH = 8;
