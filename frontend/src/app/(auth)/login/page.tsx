import { redirect } from "next/navigation";

import { DEFAULT_POST_AUTH_PATH } from "@/features/auth/constants";
import { sanitizeReturnPath } from "@/features/auth/lib/return-path";
import { SIGN_IN_ROUTE } from "@/features/auth/lib/routes";

/** Alias for `/sign-in` (common convention). */
export default async function LoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next;
  if (typeof next === "string" && next.length > 0) {
    const safe = sanitizeReturnPath(next, DEFAULT_POST_AUTH_PATH);
    redirect(`${SIGN_IN_ROUTE}?next=${encodeURIComponent(safe)}`);
  }
  redirect(SIGN_IN_ROUTE);
}
