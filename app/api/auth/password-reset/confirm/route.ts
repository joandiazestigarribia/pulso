import { NextResponse } from "next/server"
import { consumeRateLimit } from "@/lib/auth-rate-limit"
import { resetPasswordSchema } from "@/lib/auth-validation"
import { withCorsHeaders } from "@/lib/cors"
import { resetPasswordWithToken } from "@/lib/password-reset"
import { sanitizeLogData } from "@/lib/sanitize-logs"

function createResponse(
  request: Request,
  status: number,
  payload: {
    ok: boolean
    code?: string
    message: string
    errors?: Record<string, string[]>
  }
): Response {
  return withCorsHeaders(request, NextResponse.json(payload, { status }))
}

export async function OPTIONS(request: Request) {
  return withCorsHeaders(request, new NextResponse(null, { status: 204 }))
}

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit(request, "auth:password-reset-confirm", {
    limit: 5,
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
    const parsedPayload = resetPasswordSchema.safeParse(rawPayload)

    if (!parsedPayload.success) {
      return createResponse(request, 400, {
        ok: false,
        code: "INVALID_INPUT",
        message: "Revisá los campos marcados.",
        errors: parsedPayload.error.flatten().fieldErrors,
      })
    }

    await resetPasswordWithToken(parsedPayload.data)

    return createResponse(request, 200, {
      ok: true,
      message: "Tu clave fue restablecida. Ya podés iniciar sesión.",
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes("JWT_SECRET")) {
      return createResponse(request, 500, {
        ok: false,
        code: "AUTH_CONFIG_ERROR",
        message: "El servicio de autenticación no está configurado.",
      })
    }

    console.error("[auth/password-reset/confirm] unexpected error", sanitizeLogData(error))
    return createResponse(request, 400, {
      ok: false,
      code: "INVALID_RESET_TOKEN",
      message: "El enlace de restablecimiento no es válido o expiró.",
    })
  }
}
