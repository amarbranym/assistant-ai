import { redirect } from "next/navigation";

import { DEFAULT_POST_AUTH_PATH } from "@/features/auth/constants";
import { sanitizeReturnPath } from "@/features/auth/lib/return-path";

/** Legacy `/verify-email` path — redirects to email + password sign-in. */
export default async function VerifyEmailLegacyRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next;
  if (typeof next === "string" && next.length > 0) {
    const safe = sanitizeReturnPath(next, DEFAULT_POST_AUTH_PATH);
    redirect(`/sign-in?next=${encodeURIComponent(safe)}`);
  }
  redirect("/sign-in");
}
