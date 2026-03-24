import { createHmac, timingSafeEqual } from "node:crypto"

const DEFAULT_EXPIRATION = "7d"
const ONE_DAY_IN_SECONDS = 60 * 60 * 24

export interface AuthJwtPayload {
  sub: string
  email: string
  role: string
  iat: number
  exp: number
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.")
  }
  return secret
}

export function assertJwtConfig(): void {
  getJwtSecret()
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function base64UrlDecode(value: string): Buffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padding = base64.length % 4
  const normalized = padding === 0 ? base64 : `${base64}${"=".repeat(4 - padding)}`
  return Buffer.from(normalized, "base64")
}

function parseExpiresInToSeconds(value: string | undefined): number {
  const raw = (value ?? DEFAULT_EXPIRATION).trim().toLowerCase()
  const match = raw.match(/^(\d+)([smhd])$/)
  if (!match) {
    return 7 * ONE_DAY_IN_SECONDS
  }

  const amount = Number(match[1])
  const unit = match[2]

  if (unit === "s") {
    return amount
  }
  if (unit === "m") {
    return amount * 60
  }
  if (unit === "h") {
    return amount * 60 * 60
  }
  return amount * ONE_DAY_IN_SECONDS
}

function createSignature(input: string, secret: string): string {
  return base64UrlEncode(createHmac("sha256", secret).update(input).digest())
}

export function getAccessTokenMaxAgeSeconds(): number {
  return parseExpiresInToSeconds(process.env.JWT_EXPIRES_IN)
}

export function signAuthToken(payload: {
  sub: string
  email: string
  role: string
}): string {
  const now = Math.floor(Date.now() / 1000)
  const maxAgeSeconds = getAccessTokenMaxAgeSeconds()
  const header = { alg: "HS256", typ: "JWT" }
  const body: AuthJwtPayload = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    iat: now,
    exp: now + maxAgeSeconds,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedBody = base64UrlEncode(JSON.stringify(body))
  const unsignedToken = `${encodedHeader}.${encodedBody}`
  const signature = createSignature(unsignedToken, getJwtSecret())

  return `${unsignedToken}.${signature}`
}

export function verifyAuthToken(token: string): AuthJwtPayload {
  const parts = token.split(".")
  if (parts.length !== 3) {
    throw new Error("Invalid token format.")
  }

  const [encodedHeader, encodedBody, signature] = parts
  const unsignedToken = `${encodedHeader}.${encodedBody}`
  const expectedSignature = createSignature(unsignedToken, getJwtSecret())

  const signatureBuffer = Buffer.from(signature)
  const expectedSignatureBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    throw new Error("Invalid token signature.")
  }

  const decodedBody = JSON.parse(base64UrlDecode(encodedBody).toString("utf8")) as Partial<AuthJwtPayload>

  if (!decodedBody.sub || !decodedBody.email || !decodedBody.role || !decodedBody.exp || !decodedBody.iat) {
    throw new Error("Invalid token payload.")
  }

  const now = Math.floor(Date.now() / 1000)
  if (decodedBody.exp <= now) {
    throw new Error("Token expired.")
  }

  return decodedBody as AuthJwtPayload
}

export function getAuthTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie")
  if (cookieHeader) {
    const accessTokenCookie = cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith("access_token="))

    if (accessTokenCookie) {
      const token = accessTokenCookie.replace("access_token=", "")
      if (token) {
        return decodeURIComponent(token)
      }
    }
  }

  const authorizationHeader = request.headers.get("authorization")
  if (!authorizationHeader) {
    return null
  }

  const [scheme, token] = authorizationHeader.split(" ")
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null
  }

  return token
}
