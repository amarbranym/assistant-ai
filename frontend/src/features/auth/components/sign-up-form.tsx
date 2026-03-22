"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { AuthFormLayout } from "./auth-form-layout";
import { PasswordInput } from "./password-input";
import { SocialAuthButtons } from "./social-auth-buttons";
import {
  persistAccessToken,
  persistSessionCookie,
  registerUser,
} from "../api/auth.api";
import { SIGN_IN_ROUTE } from "../lib/routes";
import {
  signUpFormSchema,
  type SignUpFormValues,
} from "../schemas/auth-forms.schema";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema) as Resolver<SignUpFormValues>,
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  async function onSubmit(values: SignUpFormValues) {
    setPending(true);
    setFormError(null);
    try {
      const session = await registerUser({
        email: values.email,
        password: values.password,
        name: values.fullName,
      });
      persistAccessToken(session);
      await persistSessionCookie(session.accessToken);
      const next = searchParams.get("next");
      const dest =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : "/assistants";
      router.push(dest);
      router.refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not create account");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFormLayout
      title="Create account"
      description="Set up your profile, then sign in with email or a provider when OAuth is connected."
      footer={{
        text: "Already have an account?",
        href: SIGN_IN_ROUTE,
        linkLabel: "Sign in",
      }}
    >
      <Card className="border-border/60 shadow-none ring-1 ring-foreground/6">
        <CardContent className="space-y-4 p-5 sm:p-6">
          {formError ? (
            <p className="text-destructive text-xs leading-snug" role="alert">
              {formError}
            </p>
          ) : null}

          <SocialAuthButtons disabled={pending} />

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-muted-foreground shrink-0 text-[11px] tracking-wide uppercase">
              or email
            </span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
            <div className="space-y-1">
              <Label htmlFor="sign-up-name" className="text-xs">
                Full name
              </Label>
              <Input
                id="sign-up-name"
                type="text"
                autoComplete="name"
                placeholder="Jordan Lee"
                aria-invalid={!!errors.fullName}
                disabled={pending}
                className="h-9"
                {...register("fullName")}
              />
              {errors.fullName ? (
                <p className="text-destructive text-[11px]">
                  {errors.fullName.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="sign-up-email" className="text-xs">
                Email
              </Label>
              <Input
                id="sign-up-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={!!errors.email}
                disabled={pending}
                className="h-9"
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-destructive text-[11px]">{errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="sign-up-password" className="text-xs">
                Password
              </Label>
              <PasswordInput
                id="sign-up-password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                disabled={pending}
                className="h-9"
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-destructive text-[11px]">
                  {errors.password.message}
                </p>
              ) : (
                <p className="text-muted-foreground text-[11px]">At least 8 characters</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="sign-up-confirm" className="text-xs">
                Confirm password
              </Label>
              <PasswordInput
                id="sign-up-confirm"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                disabled={pending}
                className="h-9"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="text-destructive text-[11px]">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" className="mt-1 h-9 w-full" disabled={pending}>
              {pending ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthFormLayout>
  );
}
