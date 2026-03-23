import type { Metadata } from "next";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new account password",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
