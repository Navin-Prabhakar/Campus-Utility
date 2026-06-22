import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Extract the secure NextAuth token session
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isAuthPage = pathname.startsWith("/signin") || pathname.startsWith("/verify");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isStaticAsset = pathname.includes(".");

  // 2. NEW FIX: If user IS authenticated and trying to access signin/verify, redirect to home
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url)); // 👈 Change "/" to "/home" if your dashboard is located there
  }

  // 3. Allow public access to API auth handles and static assets, 
  // OR allow unauthenticated users to see the login pages
  if (isAuthPage || isApiAuth || isStaticAsset) {
    return NextResponse.next();
  }

  // 4. Strict Enforcer: If no session token is found and they are trying to access a protected route
  if (!token) {
    const loginUrl = new URL("/signin", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Token exists and is validated! Allow them through.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};