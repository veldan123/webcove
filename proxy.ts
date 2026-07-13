import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed the `middleware` convention to `proxy`. This runs on every
// request (per the matcher) to refresh the Supabase session cookie and guard
// protected routes.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Run on all routes except static assets and image optimization files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
