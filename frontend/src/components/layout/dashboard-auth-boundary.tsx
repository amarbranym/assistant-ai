"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { DEFAULT_POST_AUTH_PATH } from "@/features/auth/constants";
import { useAuth } from "@/features/auth/context/auth-context";
import { sanitizeReturnPath } from "@/features/auth/lib/return-path";
import { SIGN_IN_ROUTE } from "@/features/auth/lib/routes";

export function DashboardAuthBoundary({ children }: { children: ReactNode }) {
  const { isReady, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady || isAuthenticated) return;
    const raw =
      typeof window !== "undefined"
        ? `${pathname}${window.location.search}`
        : pathname || DEFAULT_POST_AUTH_PATH;
    const next = sanitizeReturnPath(raw, DEFAULT_POST_AUTH_PATH);
    router.replace(`${SIGN_IN_ROUTE}?next=${encodeURIComponent(next)}`);
  }, [isReady, isAuthenticated, pathname, router]);

  if (!isReady) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] flex-1 items-center justify-center text-sm">
        Loading session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
