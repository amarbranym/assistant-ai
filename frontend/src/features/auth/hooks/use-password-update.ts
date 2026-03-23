"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_UPDATED_MESSAGE,
  SUPABASE_ENV_MISSING_MESSAGE,
} from "../constants";
import { formatAuthError } from "../lib/auth-errors";
import { SIGN_IN_ROUTE } from "../lib/routes";

type SubmitUpdatePasswordParams = {
  password: string;
  passwordConfirm: string;
};

export function usePasswordUpdate() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const submitInFlightRef = useRef(false);

  const submit = useCallback(
    async (params: SubmitUpdatePasswordParams) => {
      if (submitInFlightRef.current) return;
      setFormError(null);
      setFormSuccess(null);

      const password = params.password;
      const confirm = params.passwordConfirm;
      if (password.length < MIN_PASSWORD_LENGTH) {
        setFormError(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
        );
        return;
      }
      if (password !== confirm) {
        setFormError("Passwords do not match");
        return;
      }

      const supabase = createBrowserSupabaseClient();
      if (!supabase) {
        setFormError(SUPABASE_ENV_MISSING_MESSAGE);
        return;
      }

      submitInFlightRef.current = true;
      setPending(true);
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setFormSuccess(PASSWORD_UPDATED_MESSAGE);
        setTimeout(() => {
          router.push(SIGN_IN_ROUTE);
          router.refresh();
        }, 800);
      } catch (e) {
        setFormError(
          formatAuthError(e, "Could not update your password. Please try again.")
        );
      } finally {
        submitInFlightRef.current = false;
        setPending(false);
      }
    },
    [router]
  );

  return {
    pending,
    formError,
    formSuccess,
    setFormError,
    setFormSuccess,
    submit,
  };
}
