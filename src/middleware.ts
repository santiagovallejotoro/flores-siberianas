import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Email confirmation / OAuth sometimes lands on Site URL with ?code=… — exchange via callback. */
export async function middleware(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/api/auth/callback";
    return NextResponse.redirect(url);
  }
  return await updateSession(request);
}

export const config = {
  matcher: ["/", "/client-portal/:path*", "/proveedor-portal/:path*"],
};
