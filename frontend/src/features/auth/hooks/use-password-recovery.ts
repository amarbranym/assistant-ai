"use client";

import { useCallback, useRef, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import {
  PASSWORD_RESET_EMAIL_SENT_MESSAGE,
  SUPABASE_ENV_MISSING_MESSAGE,
} from "../constants";
import { formatAuthError } from "../lib/auth-errors";
import { OAUTH_CALLBACK_ROUTE, RESET_PASSWORD_ROUTE } from "../lib/routes";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export function usePasswordRecovery() {
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const submitInFlightRef = useRef(false);

  const submit = useCallback(async (emailInput: string) => {
    if (submitInFlightRef.current) return;
    setFormError(null);
    setFormSuccess(null);

    const email = emailInput.trim().toLowerCase();
    if (!isValidEmail(email)) {
      setFormError("Enter a valid email address");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setFormError(SUPABASE_ENV_MISSING_MESSAGE);
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const emailRedirectTo = origin
      ? `${origin}${OAUTH_CALLBACK_ROUTE}?next=${encodeURIComponent(RESET_PASSWORD_ROUTE)}`
      : undefined;

    submitInFlightRef.current = true;
    setPending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: emailRedirectTo,
      });
      if (error) throw error;
      setFormSuccess(PASSWORD_RESET_EMAIL_SENT_MESSAGE);
    } catch (e) {
      setFormError(
        formatAuthError(e, "Could not send password reset email. Please try again.")
      );
    } finally {
      submitInFlightRef.current = false;
      setPending(false);
    }
  }, []);

  return {
    pending,
    formError,
    formSuccess,
    setFormError,
    setFormSuccess,
    submit,
  };
}
