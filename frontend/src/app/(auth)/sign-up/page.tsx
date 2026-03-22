import type { Metadata } from "next";
import { Suspense } from "react";

import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your Assistant account",
};

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <p className="text-muted-foreground text-center text-sm">Loading…</p>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
