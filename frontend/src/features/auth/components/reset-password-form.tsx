"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import { SUPABASE_ENV_MISSING_MESSAGE } from "../constants";
import { usePasswordUpdate } from "../hooks/use-password-update";
import { FORGOT_PASSWORD_ROUTE } from "../lib/routes";
import { AuthFormLayout } from "./auth-form-layout";
import { PasswordField } from "./password-field";
import { SupabaseEnvBanner } from "./supabase-env-banner";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(
    null
  );
  const [sessionError, setSessionError] = useState<string | null>(null);

  const { pending, formError, formSuccess, setFormError, setFormSuccess, submit } =
    usePasswordUpdate();

  useEffect(() => {
    let active = true;
    const run = async () => {
      const supabase = createBrowserSupabaseClient();
      if (!supabase) {
        if (!active) return;
        setHasRecoverySession(false);
        setSessionError(SUPABASE_ENV_MISSING_MESSAGE);
        return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        setHasRecoverySession(false);
        setSessionError("Your reset session is invalid or expired.");
        return;
      }
      setHasRecoverySession(Boolean(data.session));
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthFormLayout
      title="Reset password"
      description="Set a new password for your account."
      footer={{
        text: "Need a new reset link?",
        href: FORGOT_PASSWORD_ROUTE,
        linkLabel: "Request another email",
      }}
    >
      <Card className="border-border/60 shadow-none ring-1 ring-foreground/6">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <SupabaseEnvBanner />

          {sessionError ? (
            <p className="text-destructive text-xs leading-snug" role="alert">
              {sessionError}
            </p>
          ) : null}

          {formError ? (
            <p className="text-destructive text-xs leading-snug" role="alert">
              {formError}
            </p>
          ) : null}

          {formSuccess ? (
            <p className="text-foreground text-xs leading-snug" role="status">
              {formSuccess}
            </p>
          ) : null}

          <div className="space-y-3">
            <PasswordField
              id="reset-password"
              label="New password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                setFormError(null);
                setFormSuccess(null);
              }}
              disabled={pending || hasRecoverySession === false}
              autoComplete="new-password"
              placeholder="Enter your new password"
              show={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              toggleAriaLabelWhenHidden="Show password"
              toggleAriaLabelWhenVisible="Hide password"
            />

            <PasswordField
              id="reset-password-confirm"
              label="Confirm new password"
              value={passwordConfirm}
              onChange={(v) => {
                setPasswordConfirm(v);
                setFormError(null);
                setFormSuccess(null);
              }}
              disabled={pending || hasRecoverySession === false}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              show={showPasswordConfirm}
              onToggleShow={() => setShowPasswordConfirm((v) => !v)}
              toggleAriaLabelWhenHidden="Show confirm password"
              toggleAriaLabelWhenVisible="Hide confirm password"
            />

            <Button
              type="button"
              className="h-10 w-full"
              disabled={pending || hasRecoverySession !== true}
              onClick={() => void submit({ password, passwordConfirm })}
            >
              {pending ? "Updating password..." : "Update password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthFormLayout>
  );
}
