function isAuthApiError(
  e: unknown
): e is { message: string; name?: string; code?: string } {
  return (
    typeof e === "object" &&
    e !== null &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string"
  );
}

/** Supabase Auth `AuthError.code` → friendly copy (see Dashboard → Auth → Rate limits). */
const AUTH_ERROR_BY_CODE: Record<string, string> = {
  invalid_credentials: "Incorrect email or password.",
  invalid_grant: "Incorrect email or password.",
  user_already_exists: "An account with this email already exists. Try signing in.",
  weak_password: "Choose a stronger password.",
  over_email_send_rate_limit:
    "Too many verification emails were sent. Wait a few minutes, then try again.",
  email_rate_limit_exceeded:
    "Too many verification emails were sent. Wait a few minutes, then try again.",
};

function messageForAuthError(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const code =
    "code" in error && typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code
      : null;
  if (code && AUTH_ERROR_BY_CODE[code]) return AUTH_ERROR_BY_CODE[code];
  return null;
}

/**
 * Maps Supabase Auth errors (and unknown throws) to a safe user-facing string.
 */
export function formatAuthError(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  const byCode = messageForAuthError(error);
  if (byCode) return byCode;

  if (typeof error === "string" && error.trim()) return error;
  if (error instanceof Error && error.message.trim()) return error.message;
  if (isAuthApiError(error) && error.message.trim()) return error.message;
  return fallback;
}
