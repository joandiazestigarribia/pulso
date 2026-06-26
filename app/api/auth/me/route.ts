import { NextResponse } from "next/server"
import { sanitizeAuthUser } from "@/lib/auth-user"
import { withCorsHeaders } from "@/lib/cors"
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/jwt-auth"
import { getLocalUserById } from "@/lib/local-auth"

function createErrorResponse(request: Request, status: number, code: string, message: string): Response {
  return withCorsHeaders(request, NextResponse.json({ ok: false, code, message }, { status }))
}

export async function OPTIONS(request: Request) {
  return withCorsHeaders(request, new NextResponse(null, { status: 204 }))
}

export async function GET(request: Request) {
  const token = getAuthTokenFromRequest(request)

  if (!token) {
    return createErrorResponse(request, 401, "UNAUTHORIZED", "Falta el token de autenticación.")
  }

  try {
    const payload = verifyAuthToken(token)
    const user = await getLocalUserById(payload.sub)

    if (!user) {
      return createErrorResponse(request, 401, "UNAUTHORIZED", "Token de autenticación inválido.")
    }

    return withCorsHeaders(
      request,
      NextResponse.json({
        ok: true,
        user: sanitizeAuthUser(user),
      })
    )
  } catch {
    return createErrorResponse(request, 401, "UNAUTHORIZED", "Token inválido o vencido.")
  }
}
