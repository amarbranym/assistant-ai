import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "access_token";

const PROTECTED_PREFIXES = [
  "/assistants",
  "/tools",
  "/analytics",
  "/settings",
];

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.JWT_SECRET;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return redirectToSignIn(request);
  }

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return redirectToSignIn(request);
    }
    return NextResponse.next();
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return NextResponse.next();
  } catch {
    const res = redirectToSignIn(request);
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
}

export const config = {
  matcher: [
    "/",
    "/assistants/:path*",
    "/tools/:path*",
    "/analytics/:path*",
    "/settings/:path*",
  ],
};
