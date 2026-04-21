import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}

/** Must stay a static literal — Next.js parses it at compile time. Keep in sync with `lib/supabase/middleware`. */
export const config = {
  matcher: [
    "/assistants/:path*",
    "/tools/:path*",
    "/analytics/:path*",
    "/settings/:path*",
  ],
};
