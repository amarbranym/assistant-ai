"use client";

import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { useAuthUser } from "@/features/auth/hooks/use-auth-user";

export function AccountSection() {
  const { data, isLoading, isError } = useAuthUser();

  return (
    <div className="border-border bg-card/40 max-w-lg rounded-lg border p-4 shadow-theme">
      <h2 className="text-foreground text-sm font-semibold">Account</h2>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
        Signed-in profile from the API. Sign out clears your session in this
        browser.
      </p>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Name
          </dt>
          <dd className="text-foreground mt-0.5">
            {isLoading
              ? "…"
              : isError
                ? "—"
                : (data?.user.name ?? "—")}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Email
          </dt>
          <dd className="text-foreground mt-0.5 break-all">
            {isLoading
              ? "…"
              : isError
                ? "—"
                : (data?.user.email ?? "—")}
          </dd>
        </div>
      </dl>
      <div className="mt-5">
        <SignOutButton />
      </div>
    </div>
  );
}
