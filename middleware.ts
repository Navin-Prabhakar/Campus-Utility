import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Setup request headers safely
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-url", pathname);

  // 2. Extract the secure NextAuth token session
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isAuthPage = pathname.startsWith("/signin") || pathname.startsWith("/verify");
  const isApiAuth = pathname.startsWith("/api/auth");

  // 🛠️ FIX 1: Safe production/development environment override checks
  const isDevBypass = process.env.NODE_ENV === "development" && (
    pathname.startsWith("/_next") || 
    pathname.includes("__turbopack")
  );

  if (isApiAuth || isDevBypass) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // 3. If user IS authenticated and trying to access signin/verify, redirect to home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 4. Allow unauthenticated users access to the auth pages
  if (isAuthPage) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // 5. Strict Enforcer: If no session token is found, redirect protected route traffic to sign-in
  if (!token) {
    const loginUrl = new URL("/signin", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 6. Token exists and is validated! Allow them through
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// 🛠️ FIX 2: AIRTIGHT MATCHER CONFIG
// Is config se saare static assets, PWA manifests (.json, .webmanifest) aur images
// middleware ke token logic se automatically bypass ho jayenge! Security bhi tight rahegi.
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest\\.json|manifest\\.webmanifest|.*\\.png$|.*\\.jpg$|.*\\.ico$).*)",
  ],
};