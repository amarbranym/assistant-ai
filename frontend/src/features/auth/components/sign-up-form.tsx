"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { SIGN_IN_ROUTE } from "../lib/routes";
import {
  signUpFormSchema,
  type SignUpFormValues,
} from "../schemas/auth-forms.schema";

export function SignUpForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

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
    try {
      await new Promise((r) => setTimeout(r, 500));
      void values;
      router.push("/assistants");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFormLayout
      title="Create account"
      description="Add your name and sign up with email or a social provider. No API yet — submit continues to the app."
      footer={{
        text: "Already have an account?",
        href: SIGN_IN_ROUTE,
        linkLabel: "Sign in",
      }}
    >
      <Card className="border-border/80 shadow-theme">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-base font-semibold">
            Full name & credentials
          </CardTitle>
          <CardDescription>
            Password must be at least 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <SocialAuthButtons disabled={pending} />
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-xs font-medium">
              or sign up with email
            </span>
            <Separator className="flex-1" />
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="sign-up-name">Full name</Label>
              <Input
                id="sign-up-name"
                type="text"
                autoComplete="name"
                placeholder="Jordan Lee"
                aria-invalid={!!errors.fullName}
                disabled={pending}
                {...register("fullName")}
              />
              {errors.fullName ? (
                <p className="text-destructive text-xs">
                  {errors.fullName.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sign-up-email">Email</Label>
              <Input
                id="sign-up-email"
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
              <Label htmlFor="sign-up-password">Password</Label>
              <Input
                id="sign-up-password"
                type="password"
                autoComplete="new-password"
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
            <div className="space-y-1.5">
              <Label htmlFor="sign-up-confirm">Confirm password</Label>
              <Input
                id="sign-up-confirm"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                disabled={pending}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="text-destructive text-xs">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" className="h-10 w-full" disabled={pending}>
              {pending ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthFormLayout>
  );
}
