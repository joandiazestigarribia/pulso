import { NextResponse } from "next/server"
import { withCorsHeaders } from "@/lib/cors"
import { shouldUseSecureCookies } from "@/lib/identity"
const ACCESS_TOKEN_COOKIE = "access_token"

export async function OPTIONS(request: Request) {
  return withCorsHeaders(request, new NextResponse(null, { status: 204 }))
}

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true })

  const useSecureCookies = shouldUseSecureCookies(request)
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: useSecureCookies ? "none" : "lax",
    path: "/",
    maxAge: 0,
  })

  return withCorsHeaders(request, response)
}
