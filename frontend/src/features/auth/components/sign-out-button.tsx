"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAuth } from "../context/auth-context";
import { SIGN_IN_ROUTE } from "../lib/routes";

type SignOutButtonProps = {
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  label?: string;
};

export function SignOutButton({
  className,
  variant = "outline",
  size = "default",
  label = "Sign out",
}: SignOutButtonProps = {}) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    try {
      await signOut();
      router.push(SIGN_IN_ROUTE);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("border-border", className)}
      disabled={pending}
      onClick={onSignOut}
    >
      {pending ? "Signing out…" : label}
    </Button>
  );
}
