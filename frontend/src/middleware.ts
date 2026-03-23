import { type NextRequest } from "next/server";

import { handleSupabaseAuthMiddleware } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return handleSupabaseAuthMiddleware(request);
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
