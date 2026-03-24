const DEFAULT_ALLOWED_HEADERS = "Content-Type, Authorization"
const DEFAULT_ALLOWED_METHODS = "GET, POST, OPTIONS"

function getAllowedOrigins(): string[] {
  const rawOrigins = process.env.ALLOWED_ORIGINS ?? ""
  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function resolveOrigin(request: Request): string {
  const requestOrigin = request.headers.get("origin")
  const allowedOrigins = getAllowedOrigins()

  if (!requestOrigin) {
    return allowedOrigins[0] ?? ""
  }

  if (allowedOrigins.length === 0) {
    return requestOrigin
  }

  if (allowedOrigins.includes(requestOrigin)) {
    return requestOrigin
  }

  return ""
}

export function buildCorsHeaders(request: Request): Headers {
  const headers = new Headers()
  const origin = resolveOrigin(request)

  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin)
    headers.set("Vary", "Origin")
  }

  headers.set("Access-Control-Allow-Credentials", "true")
  headers.set("Access-Control-Allow-Headers", DEFAULT_ALLOWED_HEADERS)
  headers.set("Access-Control-Allow-Methods", DEFAULT_ALLOWED_METHODS)

  return headers
}

export function withCorsHeaders(request: Request, response: Response): Response {
  const corsHeaders = buildCorsHeaders(request)
  corsHeaders.forEach((value, key) => {
    response.headers.set(key, value)
  })
  return response
}
