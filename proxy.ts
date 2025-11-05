// proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // public endpoint
  if (pathname.startsWith("/api/payments/webhooks")) {
    return NextResponse.next();
  }

  // logged-in users shouldn't visit sign-in/up
  if (sessionCookie && ["/sign-in", "/sign-up"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // not logged in
  if (!sessionCookie && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // admin access only
  if (pathname.startsWith("/admin")) {
    try {
      const token = sessionCookie?.split(".")[1];
      if (!token) throw new Error("invalid cookie");
      const payload = JSON.parse(Buffer.from(token, "base64").toString());
      if (payload?.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],};
