import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Setup request headers to pass the current pathname to layout.tsx
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-url", pathname);

  // 2. Extract the secure NextAuth token session
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isAuthPage = pathname.startsWith("/signin") || pathname.startsWith("/verify");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isStaticAsset = pathname.includes(".");

  // 3. If user IS authenticated and trying to access signin/verify, redirect them to home dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 4. Allow public access to API auth routes and static assets
  if (isApiAuth || isStaticAsset) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 5. Allow unauthenticated users access to the auth pages (/signin or /verify)
  if (isAuthPage) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 6. Strict Enforcer: If no session token is found, redirect protected route traffic to sign-in
  if (!token) {
    const loginUrl = new URL("/signin", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 7. Token exists and is validated! Allow them through along with our custom tracking headers.
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  // Run on all page matching pathways
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};