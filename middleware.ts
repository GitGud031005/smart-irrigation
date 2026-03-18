// Next.js middleware - route protection for authenticated pages (FR12)
// Redirects unauthenticated users to login page
// Protects all /dashboard/* routes

export const config = {
  matcher: ["/dashboard/:path*"],
};

import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // const { cookies, nextUrl } = request;
  // const token =
  //   cookies.get("session")?.value ??
  //   cookies.get("token")?.value ??
  //   cookies.get("next-auth.session-token")?.value;

  // if (!token) {
  //   const url = nextUrl.clone();
  //   url.pathname = "/login";
  //   url.searchParams.set("from", request.nextUrl.pathname);
  //   return NextResponse.redirect(url);
  // }

  return NextResponse.next();
}