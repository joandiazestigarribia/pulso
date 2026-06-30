import { NextResponse } from "next/server"
import { consumeRateLimit } from "@/lib/auth-rate-limit"
import { mergeAnonymousBattlesToUser } from "@/lib/auth"
import { sanitizeAuthUser } from "@/lib/auth-user"
import { withCorsHeaders } from "@/lib/cors"
import { resolveRequestIdentity } from "@/lib/request-identity"
import { assertJwtConfig, getAccessTokenMaxAgeSeconds, signAuthToken } from "@/lib/jwt-auth"
import { shouldUseSecureCookies } from "@/lib/identity"
import { registerSchema } from "@/lib/auth-validation"
import { AuthError, registerLocalUser } from "@/lib/local-auth"
import { sanitizeLogData } from "@/lib/sanitize-logs"

const ACCESS_TOKEN_COOKIE = "access_token"

function createErrorResponse(
  request: Request,
  status: number,
  code: string,
  message: string,
  errors?: Record<string, string[]>
): Response {
  return withCorsHeaders(request, NextResponse.json({ ok: false, code, message, errors }, { status }))
}

export async function OPTIONS(request: Request) {
  return withCorsHeaders(request, new NextResponse(null, { status: 204 }))
}

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit(request, "auth:register")
  if (!rateLimit.allowed) {
    const response = createErrorResponse(
      request,
      429,
      "TOO_MANY_REQUESTS",
      "Demasiadas solicitudes. Probá nuevamente más tarde."
    )
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds))
    return response
  }

  try {
    assertJwtConfig()
    const maxAge = getAccessTokenMaxAgeSeconds()
    const rawPayload = (await request.json()) as unknown
    const parsedPayload = registerSchema.safeParse(rawPayload)

    if (!parsedPayload.success) {
      return createErrorResponse(
        request,
        400,
        "INVALID_INPUT",
        "Datos de registro inválidos.",
        parsedPayload.error.flatten().fieldErrors
      )
    }

    const user = await registerLocalUser(parsedPayload.data)
    const identity = resolveRequestIdentity(request)

    await mergeAnonymousBattlesToUser({
      anonymousId: identity.anonymousId,
      targetUserId: user.id,
    })

    const token = signAuthToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json(
      {
        ok: true,
        user: sanitizeAuthUser(user),
      },
      { status: 201 }
    )

    const useSecureCookies = shouldUseSecureCookies(request)
    response.cookies.set(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: useSecureCookies ? "none" : "lax",
      path: "/",
      maxAge,
    })

    return withCorsHeaders(request, response)
  } catch (error) {
    if (error instanceof AuthError) {
      return createErrorResponse(request, error.status, error.code, error.message)
    }
    if (error instanceof Error && error.message.includes("JWT_SECRET")) {
      return createErrorResponse(
        request,
        500,
        "AUTH_CONFIG_ERROR",
        "El servicio de autenticación no está configurado."
      )
    }

    console.error("[auth/register] unexpected error", sanitizeLogData(error))
    return createErrorResponse(request, 500, "INTERNAL_ERROR", "Error inesperado de autenticación.")
  }
}
