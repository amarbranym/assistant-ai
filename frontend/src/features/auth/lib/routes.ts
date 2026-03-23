export const SIGN_IN_ROUTE = "/sign-in" as const;
export const SIGN_UP_ROUTE = "/sign-up" as const;
export const FORGOT_PASSWORD_ROUTE = "/forgot-password" as const;
export const RESET_PASSWORD_ROUTE = "/reset-password" as const;

/** Legacy path; redirects to `SIGN_IN_ROUTE` (see `app/(auth)/verify-email/page.tsx`). */
export const VERIFY_EMAIL_LEGACY_ROUTE = "/verify-email" as const;

/** Supabase OAuth / magic-link redirect (see `app/auth/callback/route.ts`). */
export const OAUTH_CALLBACK_ROUTE = "/auth/callback" as const;
