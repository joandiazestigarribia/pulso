import { NextResponse } from "next/server"
import { consumeRateLimit } from "@/lib/auth-rate-limit"
import { requestPasswordResetSchema } from "@/lib/auth-validation"
import { withCorsHeaders } from "@/lib/cors"
import { requestPasswordReset } from "@/lib/password-reset"
import { sanitizeLogData } from "@/lib/sanitize-logs"

function createResponse(
  request: Request,
  status: number,
  payload: {
    ok: boolean
    code?: string
    message: string
    resetUrl?: string | null
    errors?: Record<string, string[]>
  }
): Response {
  return withCorsHeaders(request, NextResponse.json(payload, { status }))
}

export async function OPTIONS(request: Request) {
  return withCorsHeaders(request, new NextResponse(null, { status: 204 }))
}

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit(request, "auth:password-reset-request", {
    limit: 3,
    windowMs: 60_000,
  })
  if (!rateLimit.allowed) {
    const response = createResponse(request, 429, {
      ok: false,
      code: "TOO_MANY_REQUESTS",
      message: "Demasiadas solicitudes. Probá nuevamente más tarde.",
    })
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds))
    return response
  }

  try {
    const rawPayload = (await request.json()) as unknown
    const parsedPayload = requestPasswordResetSchema.safeParse(rawPayload)

    if (!parsedPayload.success) {
      return createResponse(request, 400, {
        ok: false,
        code: "INVALID_INPUT",
        message: "Ingresá un correo válido.",
        errors: parsedPayload.error.flatten().fieldErrors,
      })
    }

    const origin = new URL(request.url).origin
    const result = await requestPasswordReset({
      email: parsedPayload.data.email,
      origin,
    })

    return createResponse(request, 200, {
      ok: true,
      message: "Si existe una cuenta con ese correo, vas a recibir un email para restablecerla.",
      resetUrl: result.resetUrl,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes("JWT_SECRET")) {
      return createResponse(request, 500, {
        ok: false,
        code: "AUTH_CONFIG_ERROR",
        message: "El servicio de autenticación no está configurado.",
      })
    }

    if (error instanceof Error && error.message.includes("EMAIL_CONFIG")) {
      return createResponse(request, 500, {
        ok: false,
        code: "EMAIL_CONFIG_ERROR",
        message: "El servicio de email no esta configurado.",
      })
    }

    console.error("[auth/password-reset/request] unexpected error", sanitizeLogData(error))
    return createResponse(request, 500, {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Error inesperado al solicitar el restablecimiento.",
    })
  }
}
