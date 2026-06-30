import { timingSafeEqual } from "node:crypto"
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/jwt-auth"

export type AdminAccessResult =
  | {
      allowed: true
      userId: string | null
    }
  | {
      allowed: false
      status: 401 | 403
      body: {
        ok: false
        code: "ADMIN_AUTH_REQUIRED" | "ADMIN_FORBIDDEN"
        message: string
      }
    }

function safeTokenEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

function hasValidAdminHeader(request: Request): boolean {
  const configuredToken = process.env.ADMIN_API_TOKEN?.trim()
  const requestToken = request.headers.get("x-admin-token")?.trim()

  if (!configuredToken || !requestToken) {
    return false
  }

  return safeTokenEquals(requestToken, configuredToken)
}

export function requireAdminAccess(request: Request): AdminAccessResult {
  if (hasValidAdminHeader(request)) {
    return { allowed: true, userId: null }
  }

  const authToken = getAuthTokenFromRequest(request)
  if (!authToken) {
    return {
      allowed: false,
      status: 401,
      body: {
        ok: false,
        code: "ADMIN_AUTH_REQUIRED",
        message: "Necesitás credenciales de administrador.",
      },
    }
  }

  try {
    const payload = verifyAuthToken(authToken)
    if (payload.role === "ADMIN") {
      return { allowed: true, userId: payload.sub }
    }
  } catch {
    return {
      allowed: false,
      status: 401,
      body: {
        ok: false,
        code: "ADMIN_AUTH_REQUIRED",
        message: "Las credenciales de administrador no son válidas.",
      },
    }
  }

  return {
    allowed: false,
    status: 403,
    body: {
      ok: false,
      code: "ADMIN_FORBIDDEN",
      message: "Tu usuario no tiene permisos de administrador.",
    },
  }
}
