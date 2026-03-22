"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import {
  MIN_PASSWORD_LENGTH,
  SIGNUP_CHECK_EMAIL_MESSAGE,
  SUPABASE_ENV_MISSING_MESSAGE,
} from "../constants";
import { formatAuthError } from "../lib/auth-errors";

export type EmailPasswordAuthVariant = "sign-in" | "sign-up";

export type SubmitEmailPasswordParams = {
  email: string;
  password: string;
  /** Required when `variant` is `"sign-up"`. */
  passwordConfirm?: string;
};

export type UseEmailPasswordAuthOptions = {
  redirectTo: string;
  variant: EmailPasswordAuthVariant;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

/**
 * Email + password sign-in / sign-up via `signInWithPassword` and `signUp`.
 */
export function useEmailPasswordAuth(options: UseEmailPasswordAuthOptions) {
  const { redirectTo, variant } = options;
  const router = useRouter();

  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const submitInFlightRef = useRef(false);

  const submit = useCallback(
    async (params: SubmitEmailPasswordParams) => {
      if (submitInFlightRef.current) return;
      setFormError(null);
      setFormSuccess(null);

      const email = params.email.trim().toLowerCase();
      const password = params.password;

      if (!isValidEmail(email)) {
        setFormError("Enter a valid email address");
        return;
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        setFormError(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
        );
        return;
      }

      if (variant === "sign-up") {
        const confirm = params.passwordConfirm ?? "";
        if (password !== confirm) {
          setFormError("Passwords do not match");
          return;
        }
      }

      const supabase = createBrowserSupabaseClient();
      if (!supabase) {
        setFormError(SUPABASE_ENV_MISSING_MESSAGE);
        return;
      }

      submitInFlightRef.current = true;
      setPending(true);
      try {
        if (variant === "sign-in") {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          router.push(redirectTo);
          router.refresh();
          return;
        }

        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: origin
            ? { emailRedirectTo: `${origin}/auth/callback` }
            : undefined,
        });
        if (error) throw error;

        if (data.session) {
          router.push(redirectTo);
          router.refresh();
          return;
        }

        setFormSuccess(SIGNUP_CHECK_EMAIL_MESSAGE);
      } catch (e) {
        setFormError(
          formatAuthError(e, "Something went wrong. Please try again.")
        );
      } finally {
        submitInFlightRef.current = false;
        setPending(false);
      }
    },
    [redirectTo, router, variant]
  );

  return {
    pending,
    formError,
    setFormError,
    formSuccess,
    setFormSuccess,
    submit,
  };
}
