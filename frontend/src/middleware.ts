import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest): NextResponse {
  const token        = req.cookies.get("bankops_token")?.value;
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/backend/") ||
    pathname.startsWith("/api/analyse") ||
    pathname.startsWith("/api/generate-cases");

  if (!isPublic && !token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && token) {
    const homeUrl = req.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};