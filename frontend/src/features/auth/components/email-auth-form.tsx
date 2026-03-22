"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { DEFAULT_POST_AUTH_PATH } from "../constants";
import { useEmailPasswordAuth } from "../hooks/use-email-password-auth";
import { sanitizeReturnPath } from "../lib/return-path";
import { SIGN_IN_ROUTE, SIGN_UP_ROUTE } from "../lib/routes";
import { AuthFormLayout } from "./auth-form-layout";
import { PasswordField } from "./password-field";
import { SocialAuthButtons } from "./social-auth-buttons";
import { SupabaseEnvBanner } from "./supabase-env-banner";

export type EmailAuthFormVariant = "sign-in" | "sign-up";

type EmailAuthFormProps = {
  variant: EmailAuthFormVariant;
};

const copy: Record<
  EmailAuthFormVariant,
  { title: string; description: string; footer: { text: string; href: string; linkLabel: string } }
> = {
  "sign-in": {
    title: "Sign in",
    description:
      "Use your email and password, or continue with a provider below.",
    footer: {
      text: "Need an account?",
      href: SIGN_UP_ROUTE,
      linkLabel: "Create account",
    },
  },
  "sign-up": {
    title: "Create account",
    description:
      "Choose a password and confirm it. If email confirmation is enabled, you’ll verify your inbox before signing in.",
    footer: {
      text: "Already have an account?",
      href: SIGN_IN_ROUTE,
      linkLabel: "Sign in",
    },
  },
};

/**
 * Supabase password auth: `signInWithPassword` / `signUp` (plus OAuth via `SocialAuthButtons`).
 */
export function EmailAuthForm({ variant }: EmailAuthFormProps) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const nextParam = searchParams.get("next");
  const redirectTo = useMemo(
    () => sanitizeReturnPath(nextParam, DEFAULT_POST_AUTH_PATH),
    [nextParam]
  );

  const {
    pending,
    formError,
    setFormError,
    formSuccess,
    setFormSuccess,
    submit,
  } = useEmailPasswordAuth({
    redirectTo,
    variant,
  });

  const clearFeedback = useCallback(() => {
    setFormError(null);
    setFormSuccess(null);
  }, [setFormError, setFormSuccess]);

  const c = copy[variant];

  const footer = useMemo(() => {
    const f = copy[variant].footer;
    const n = searchParams.get("next");
    const q = n
      ? `?next=${encodeURIComponent(sanitizeReturnPath(n, DEFAULT_POST_AUTH_PATH))}`
      : "";
    return { ...f, href: `${f.href}${q}` };
  }, [variant, searchParams]);

  return (
    <AuthFormLayout title={c.title} description={c.description} footer={footer}>
      <Card className="border-border/60 shadow-none ring-1 ring-foreground/6">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <SupabaseEnvBanner />

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

          <SocialAuthButtons disabled={pending} oauthReturnPath={redirectTo} />

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-muted-foreground shrink-0 text-[11px] tracking-wide uppercase">
              or email
            </span>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor={`auth-email-${variant}`} className="text-xs">
                Email
              </Label>
              <Input
                id={`auth-email-${variant}`}
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFeedback();
                }}
                disabled={pending}
                className="h-9"
              />
            </div>

            <PasswordField
              id={`auth-password-${variant}`}
              label="Password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                clearFeedback();
              }}
              disabled={pending}
              autoComplete={
                variant === "sign-in" ? "current-password" : "new-password"
              }
              placeholder="Enter your password"
              show={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              toggleAriaLabelWhenHidden="Show password"
              toggleAriaLabelWhenVisible="Hide password"
            />

            {variant === "sign-up" ? (
              <PasswordField
                id={`auth-password-confirm-${variant}`}
                label="Confirm password"
                value={passwordConfirm}
                onChange={(v) => {
                  setPasswordConfirm(v);
                  clearFeedback();
                }}
                disabled={pending}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                show={showPasswordConfirm}
                onToggleShow={() => setShowPasswordConfirm((v) => !v)}
                toggleAriaLabelWhenHidden="Show confirm password"
                toggleAriaLabelWhenVisible="Hide confirm password"
              />
            ) : null}

            <Button
              type="button"
              variant="default"
              className="h-10 w-full"
              disabled={pending}
              onClick={() =>
                void submit({
                  email,
                  password,
                  passwordConfirm:
                    variant === "sign-up" ? passwordConfirm : undefined,
                })
              }
            >
              {pending
                ? variant === "sign-in"
                  ? "Signing in…"
                  : "Creating account…"
                : variant === "sign-in"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthFormLayout>
  );
}
