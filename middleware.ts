import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname, hostname } = req.nextUrl;

  // 🛠️ DEVELOPER BYPASS: If running on localhost, skip authentication checks entirely
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return NextResponse.next();
  }

  // 1. Extract the secure NextAuth token session from the request headers
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // 2. If the user is trying to access authentication pages, don't intercept them!
  if (
    pathname.startsWith("/signin") || 
    pathname.startsWith("/verify-link") || 
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") // Allows static assets like logos, images, or favicons
  ) {
    return NextResponse.next();
  }

  // 3. If the token doesn't exist, the student is logged out. 
  if (!token) {
    const loginUrl = new URL("/signin", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Token exists! Let them proceed to the website seamlessly.
  return NextResponse.next();
}

/**
 * 5. Configure the Matcher
 * This tells Next.js exactly which paths to run the middleware on.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};