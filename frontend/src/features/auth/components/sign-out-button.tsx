"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { logoutUser } from "../api/auth.api";
import { AUTH_ME_QUERY_KEY } from "../hooks/use-auth-user";
import { SIGN_IN_ROUTE } from "../lib/routes";

export function SignOutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    try {
      await logoutUser();
      await queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
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
