import { NextResponse, type NextRequest } from "next/server"
import {
  ANON_SESSION_COOKIE,
  AUTH_USER_COOKIE,
  buildAnonSessionId,
  shouldUseSecureCookies,
} from "@/lib/identity"

const PROTECTED_PATHS = ["/profile/full", "/api/export"]

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path))
}

export function proxy(request: NextRequest) {
  const userId = request.cookies.get(AUTH_USER_COOKIE)?.value ?? null
  const anonymousId = request.cookies.get(ANON_SESSION_COOKIE)?.value ?? null

  if (!userId && isProtectedPath(request.nextUrl.pathname)) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.next()

  if (!userId && !anonymousId) {
    response.cookies.set(ANON_SESSION_COOKIE, buildAnonSessionId(), {
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureCookies(request),
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
