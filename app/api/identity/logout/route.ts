import { NextResponse } from "next/server"
import { ANON_SESSION_COOKIE, AUTH_USER_COOKIE, shouldUseSecureCookies } from "@/lib/identity"

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true })

  response.cookies.set("access_token", "", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: 0,
  })

  response.cookies.set(AUTH_USER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(request),
    path: "/",
    maxAge: 0,
  })

  response.cookies.set(ANON_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(request),
    path: "/",
    maxAge: 0,
  })

  return response
}
