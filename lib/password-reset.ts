import { createHmac, timingSafeEqual } from "node:crypto"
import { prisma } from "@/lib/db"
import { hashPassword } from "@/lib/password"

const PASSWORD_RESET_TOKEN_MAX_AGE_SECONDS = 15 * 60
const PASSWORD_RESET_PURPOSE = "password_reset"

interface PasswordResetTokenPayload {
  sub: string
  email: string
  purpose: typeof PASSWORD_RESET_PURPOSE
  iat: number
  exp: number
}

export interface PasswordResetRequestResult {
  resetUrl: string | null
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.")
  }
  return secret
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

function createSignature(input: string): string {
  return base64UrlEncode(createHmac("sha256", getJwtSecret()).update(input).digest())
}

function signPasswordResetToken(payload: { userId: string; email: string }): string {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: "HS256", typ: "JWT" }
  const body: PasswordResetTokenPayload = {
    sub: payload.userId,
    email: payload.email,
    purpose: PASSWORD_RESET_PURPOSE,
    iat: now,
    exp: now + PASSWORD_RESET_TOKEN_MAX_AGE_SECONDS,
  }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedBody = base64UrlEncode(JSON.stringify(body))
  const unsignedToken = `${encodedHeader}.${encodedBody}`
  const signature = createSignature(unsignedToken)

  return `${unsignedToken}.${signature}`
}

function verifyPasswordResetToken(token: string): PasswordResetTokenPayload {
  const parts = token.split(".")
  if (parts.length !== 3) {
    throw new Error("Invalid reset token format.")
  }

  const [encodedHeader, encodedBody, signature] = parts
  const unsignedToken = `${encodedHeader}.${encodedBody}`
  const expectedSignature = createSignature(unsignedToken)
  const signatureBuffer = Buffer.from(signature)
  const expectedSignatureBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    throw new Error("Invalid reset token signature.")
  }

  const decodedBody = JSON.parse(base64UrlDecode(encodedBody).toString("utf8")) as Partial<PasswordResetTokenPayload>
  if (
    !decodedBody.sub ||
    !decodedBody.email ||
    decodedBody.purpose !== PASSWORD_RESET_PURPOSE ||
    !decodedBody.exp ||
    !decodedBody.iat
  ) {
    throw new Error("Invalid reset token payload.")
  }

  const now = Math.floor(Date.now() / 1000)
  if (decodedBody.exp <= now) {
    throw new Error("Reset token expired.")
  }

  return decodedBody as PasswordResetTokenPayload
}

function canExposeResetUrl(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.PULSO_TEST_MODE === "1"
}

export async function requestPasswordReset(params: {
  email: string
  origin: string
}): Promise<PasswordResetRequestResult> {
  const user = await prisma.user.findUnique({
    where: { email: params.email },
    select: { id: true, email: true, passwordHash: true },
  })

  if (!user?.email || !user.passwordHash || !canExposeResetUrl()) {
    return { resetUrl: null }
  }

  const token = signPasswordResetToken({ userId: user.id, email: user.email })
  const resetUrl = new URL("/reset-password", params.origin)
  resetUrl.searchParams.set("token", token)

  return { resetUrl: resetUrl.toString() }
}

export async function resetPasswordWithToken(params: {
  token: string
  password: string
}): Promise<void> {
  const payload = verifyPasswordResetToken(params.token)
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, passwordHash: true },
  })

  if (!user?.email || user.email !== payload.email || !user.passwordHash) {
    throw new Error("Invalid reset token subject.")
  }

  const passwordHash = await hashPassword(params.password)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })
}
