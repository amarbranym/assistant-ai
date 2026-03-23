"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SIGN_IN_ROUTE } from "../lib/routes";
import { AuthFormLayout } from "./auth-form-layout";
import { SupabaseEnvBanner } from "./supabase-env-banner";
import { usePasswordRecovery } from "../hooks/use-password-recovery";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const { pending, formError, formSuccess, setFormError, setFormSuccess, submit } =
    usePasswordRecovery();

  return (
    <AuthFormLayout
      title="Forgot password"
      description="Enter your email and we will send a password reset link."
      footer={{
        text: "Remembered your password?",
        href: SIGN_IN_ROUTE,
        linkLabel: "Back to sign in",
      }}
    >
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

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="forgot-password-email" className="text-xs">
                Email
              </Label>
              <Input
                id="forgot-password-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFormError(null);
                  setFormSuccess(null);
                }}
                disabled={pending}
                className="h-9"
              />
            </div>

            <Button
              type="button"
              className="h-10 w-full"
              disabled={pending}
              onClick={() => void submit(email)}
            >
              {pending ? "Sending reset link..." : "Send reset link"}
            </Button>

            <p className="text-muted-foreground text-center text-xs">
              The reset email opens a secure link. You can also{" "}
              <Link href={SIGN_IN_ROUTE} className="text-primary hover:underline">
                return to sign in
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthFormLayout>
  );
}
