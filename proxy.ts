import { NextResponse, type NextRequest } from "next/server"
import {
  ANON_SESSION_COOKIE,
  buildAnonSessionId,
  shouldUseSecureCookies,
} from "@/lib/identity"

const ACCESS_TOKEN_COOKIE = "access_token"
const PROTECTED_PATHS = ["/profile/full", "/api/export"]
const AUTH_PAGES = ["/login", "/register"]

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path))
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((path) => pathname.startsWith(path))
}

function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/")
}

export function proxy(request: NextRequest) {
  const hasAccessToken = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value)
  const anonymousId = request.cookies.get(ANON_SESSION_COOKIE)?.value ?? null

  if (hasAccessToken && isAuthPage(request.nextUrl.pathname)) {
    const battleUrl = new URL("/battle", request.url)
    return NextResponse.redirect(battleUrl)
  }

  if (!hasAccessToken && isProtectedPath(request.nextUrl.pathname)) {
    if (isApiPath(request.nextUrl.pathname)) {
      return NextResponse.json(
        { ok: false, code: "AUTH_REQUIRED", message: "Necesitás iniciar sesión." },
        { status: 401 }
      )
    }

    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.next()

  if (!hasAccessToken && !anonymousId) {
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
