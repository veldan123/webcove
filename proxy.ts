import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Hosts that ARE Webcove itself (app + public /[slug] sites). Anything else is
// a customer's connected custom domain.
function isOwnHost(host: string): boolean {
  const h = host.split(":")[0].toLowerCase();
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "webcove.io" ||
    h === "www.webcove.io" ||
    h.endsWith(".vercel.app")
  );
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // A customer's own domain → internally render that site via /d/<host>/...
  if (host && !isOwnHost(host)) {
    const cleanHost = host.split(":")[0].toLowerCase();
    const path = request.nextUrl.pathname;
    const url = request.nextUrl.clone();
    url.pathname = `/d/${cleanHost}${path === "/" ? "" : path}`;
    return NextResponse.rewrite(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
