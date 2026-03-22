import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Assistant",
};

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <p className="text-muted-foreground text-center text-sm">Loading…</p>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
