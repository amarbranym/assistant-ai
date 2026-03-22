import type { Metadata } from "next";
import { Suspense } from "react";

import { EmailAuthForm } from "@/features/auth/components/email-auth-form";

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
      <EmailAuthForm variant="sign-in" />
    </Suspense>
  );
}
