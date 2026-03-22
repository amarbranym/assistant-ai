/**
 * Authentication — Supabase Auth in the browser, Express `/auth/me` via Bearer token.
 *
 * Session: `@supabase/ssr` (middleware + cookies) + `AuthProvider`.
 * API: `sessionStorage` access token → `Authorization: Bearer` (see `lib/api/client.ts`).
 */
export { AuthProvider, useAuth } from "./context/auth-context";
export {
  DEFAULT_POST_AUTH_PATH,
  MIN_PASSWORD_LENGTH,
  SIGNUP_CHECK_EMAIL_MESSAGE,
  SUPABASE_ENV_MISSING_MESSAGE,
} from "./constants";
export { fetchCurrentUser } from "./api/auth.api";
export { AUTH_ME_QUERY_KEY } from "./lib/auth-query-keys";
export { formatAuthError } from "./lib/auth-errors";
export { sanitizeReturnPath } from "./lib/return-path";
export { useAuthUser } from "./hooks/use-auth-user";
export { useEmailPasswordAuth } from "./hooks/use-email-password-auth";
export type { EmailAuthFormVariant } from "./components/email-auth-form";
export type {
  EmailPasswordAuthVariant,
  SubmitEmailPasswordParams,
  UseEmailPasswordAuthOptions,
} from "./hooks/use-email-password-auth";
export {
  SIGN_IN_ROUTE,
  SIGN_UP_ROUTE,
  VERIFY_EMAIL_LEGACY_ROUTE,
  OAUTH_CALLBACK_ROUTE,
} from "./lib/routes";
export type { AuthUser } from "./types/auth-api.types";

export {
  AuthFormLayout,
  EmailAuthForm,
  PasswordField,
  SignOutButton,
  SocialAuthButtons,
} from "./components";
