"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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
  loginUser,
  persistAccessToken,
  persistSessionCookie,
} from "../api/auth.api";
import { SIGN_UP_ROUTE } from "../lib/routes";
import {
  signInFormSchema,
  type SignInFormValues,
} from "../schemas/auth-forms.schema";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema) as Resolver<SignInFormValues>,
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  async function onSubmit(values: SignInFormValues) {
    setPending(true);
    setFormError(null);
    try {
      const session = await loginUser({
        email: values.email,
        password: values.password,
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
      setFormError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFormLayout
      title="Sign into your account"
      description="Please sign in using your email or choose a provider to get started"
      footer={{
        text: "Need an account?",
        href: SIGN_UP_ROUTE,
        linkLabel: "Sign up",
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
              <Label htmlFor="sign-in-email" className="text-xs">
                Email
              </Label>
              <Input
                id="sign-in-email"
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
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="sign-in-password" className="text-xs">
                  Password
                </Label>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground text-[11px] underline-offset-4 hover:underline"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot?
                </Link>
              </div>
              <PasswordInput
                id="sign-in-password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                disabled={pending}
                className="h-9"
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-destructive text-[11px]">
                  {errors.password.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" className="mt-1 h-9 w-full" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthFormLayout>
  );
}
