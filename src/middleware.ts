import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/api/auth/login", "/api/auth/reset-password"];

export function middleware(request: NextRequest) {
  const isPublic = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route));
  if (isPublic) return NextResponse.next();

  const token = request.cookies.get("session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
