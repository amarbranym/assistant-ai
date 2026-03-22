"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { AuthFormLayout } from "./auth-form-layout";
import { SocialAuthButtons } from "./social-auth-buttons";
import { SIGN_UP_ROUTE } from "../lib/routes";
import {
  signInFormSchema,
  type SignInFormValues,
} from "../schemas/auth-forms.schema";

export function SignInForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema) as Resolver<SignInFormValues>,
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  async function onSubmit(values: SignInFormValues) {
    setPending(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      void values;
      router.push("/assistants");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFormLayout
      title="Sign in"
      description="Use your email or a social account. Backend auth is not wired yet — this is a UI flow only."
      footer={{
        text: "Need an account?",
        href: SIGN_UP_ROUTE,
        linkLabel: "Sign up",
      }}
    >
      <Card className="border-border/80 shadow-theme">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-base font-semibold">
            Email & password
          </CardTitle>
          <CardDescription>
            Credentials are not sent anywhere yet; submit redirects to the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <SocialAuthButtons disabled={pending} />
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-xs font-medium">
              or continue with email
            </span>
            <Separator className="flex-1" />
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="sign-in-email">Email</Label>
              <Input
                id="sign-in-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={!!errors.email}
                disabled={pending}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-destructive text-xs">{errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="sign-in-password">Password</Label>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="sign-in-password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                disabled={pending}
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-destructive text-xs">
                  {errors.password.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" className="h-10 w-full" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthFormLayout>
  );
}
