import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Middleware logic is disabled
  // const path = request.nextUrl.pathname;
  // const isProtectedPath = path.startsWith("/tasks");
  // const token = request.cookies.get("access_token")?.value;
  // const isAuthenticated = !!token;

  // if (isProtectedPath && !isAuthenticated) {
  //   const url = new URL("/login", request.url);
  //   url.searchParams.set("from", path);
  //   return NextResponse.redirect(url);
  // }

  // if (path === "/login" && isAuthenticated) {
  //   return NextResponse.redirect(new URL("/tasks", request.url));
  // }


  return NextResponse.next();
}

export const config = {
  matcher: ["/tasks/:path*", "/login"],
};

