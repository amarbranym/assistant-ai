"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { useAuth } from "../context/auth-context";
import { SIGN_IN_ROUTE } from "../lib/routes";

export function SignOutButton() {
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
      variant="outline"
      className="border-border"
      disabled={pending}
      onClick={onSignOut}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
