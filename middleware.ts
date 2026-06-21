import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Extract the secure NextAuth token session from the request headers
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // 2. Allow public access ONLY to the core authentication logic and static files
  if (
    pathname.startsWith("/signin") || 
    pathname.startsWith("/verify") || // 🛠️ Updated to match your client-side /verify route
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") // Allows static assets like logos, images, or favicons
  ) {
    return NextResponse.next();
  }

  // 3. Strict Enforcer: If no encrypted session token is found, block access immediately
  if (!token) {
    const loginUrl = new URL("/signin", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Token exists and is validated! Allow the student to pass through.
  return NextResponse.next();
}

/**
 * 5. Configure the Matcher
 * Tells Next.js to intercept all paths across the app engine.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};