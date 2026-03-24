import { NextResponse } from "next/server"
import { withCorsHeaders } from "@/lib/cors"
import { AUTH_USER_COOKIE, shouldUseSecureCookies } from "@/lib/identity"

const ACCESS_TOKEN_COOKIE = "access_token"

export async function OPTIONS(request: Request) {
  return withCorsHeaders(request, new NextResponse(null, { status: 204 }))
}

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true })

  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
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

  return withCorsHeaders(request, response)
}
