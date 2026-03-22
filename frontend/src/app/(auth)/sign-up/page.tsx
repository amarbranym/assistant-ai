import type { Metadata } from "next";
import { Suspense } from "react";

import { EmailAuthForm } from "@/features/auth/components/email-auth-form";

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
      <EmailAuthForm variant="sign-up" />
    </Suspense>
  );
}
