import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicCredentials } from "./config";

const PROTECTED_PREFIXES = ["/assistants", "/tools", "/analytics", "/settings"];

function isProtectedPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function redirectToSignIn(request: NextRequest) {
  const url = new URL("/sign-in", request.url);
  const path = request.nextUrl.pathname + request.nextUrl.search;
  if (path && path !== "/sign-in") {
    url.searchParams.set("next", path);
  }
  return NextResponse.redirect(url);
}

/**
 * Refreshes the Supabase session (cookie rotation) and enforces auth on matched routes.
 */
export async function handleSupabaseAuthMiddleware(
  request: NextRequest
): Promise<NextResponse> {
  const creds = getSupabasePublicCredentials();
  if (!creds) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(creds.url, creds.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isProtectedPath(pathname) && !user) {
    return redirectToSignIn(request);
  }

  return supabaseResponse;
}
