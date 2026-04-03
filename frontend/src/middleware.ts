import { NextRequest, NextResponse } from "next/server";

/**
 * Route protection middleware.
 *
 * Redirects unauthenticated users to /login.
 * The auth check reads the HttpOnly cookie set by the login route handler.
 *
 * Note: This middleware only checks cookie presence, not JWT validity.
 * The Java backend performs cryptographic validation on every API request.
 */
export function middleware(req: NextRequest): NextResponse {
  const token       = req.cookies.get("bankops_token")?.value;
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth/");

  if (!isPublic && !token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in — don't show login page again
  if (pathname === "/login" && token) {
    const homeUrl = req.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
