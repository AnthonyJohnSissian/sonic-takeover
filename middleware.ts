import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Redirect root to /enter
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/enter", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
