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
  emailSent: boolean
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

function getConfiguredAppOrigin(fallbackOrigin: string): string {
  const appUrl = process.env.APP_URL?.trim()
  if (!appUrl) {
    return fallbackOrigin
  }

  return appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl
}

function getEmailConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.EMAIL_FROM?.trim()
  if (!apiKey || !from) {
    return null
  }

  return { apiKey, from }
}

function assertEmailConfig(): { apiKey: string; from: string } {
  const config = getEmailConfig()
  if (!config) {
    throw new Error("EMAIL_CONFIG is not configured.")
  }

  return config
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildPasswordResetEmail(params: { resetUrl: string }): { subject: string; html: string; text: string } {
  const escapedResetUrl = escapeHtml(params.resetUrl)
  const subject = "Restablece tu clave de Pulso"
  const text = [
    "Recibimos una solicitud para restablecer tu clave de Pulso.",
    "El enlace vence en 15 minutos.",
    "",
    params.resetUrl,
    "",
    "Si no solicitaste este cambio, podes ignorar este email.",
  ].join("\n")
  const html = `
    <div style="margin:0;padding:28px;background:#080b1a;color:#eaf7ff;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:560px;margin:0 auto;border:1px solid rgba(0,240,255,.25);border-radius:24px;background:#111739;padding:28px;">
        <p style="margin:0 0 10px;color:#7be3ff;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">Pulso</p>
        <h1 style="margin:0 0 14px;font-size:28px;line-height:1.05;color:#ffffff;">Restablece tu clave</h1>
        <p style="margin:0 0 18px;color:#d8e9ff;font-size:15px;line-height:1.55;">
          Recibimos una solicitud para restablecer tu clave. Este enlace vence en 15 minutos.
        </p>
        <a href="${escapedResetUrl}" style="display:inline-block;border-radius:12px;background:#00ff66;color:#07110c;padding:12px 18px;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;">
          Crear nueva clave
        </a>
        <p style="margin:20px 0 0;color:#9fb0c6;font-size:12px;line-height:1.5;">
          Si el boton no funciona, copia y pega este link en tu navegador:<br />
          <span style="color:#7be3ff;word-break:break-all;">${escapedResetUrl}</span>
        </p>
        <p style="margin:18px 0 0;color:#9fb0c6;font-size:12px;">
          Si no solicitaste este cambio, podes ignorar este email.
        </p>
      </div>
    </div>
  `

  return { subject, html, text }
}

async function sendPasswordResetEmail(params: { to: string; resetUrl: string }): Promise<void> {
  const config = assertEmailConfig()
  const email = buildPasswordResetEmail({ resetUrl: params.resetUrl })
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [params.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [
        {
          name: "category",
          value: "password_reset",
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as unknown
    throw new Error(`RESEND_EMAIL_SEND_FAILED:${response.status}:${JSON.stringify(errorPayload)}`)
  }
}

export async function requestPasswordReset(params: {
  email: string
  origin: string
}): Promise<PasswordResetRequestResult> {
  const shouldExposeResetUrl = canExposeResetUrl()
  const emailConfig = getEmailConfig()
  if (!shouldExposeResetUrl && !emailConfig) {
    assertEmailConfig()
  }

  const user = await prisma.user.findUnique({
    where: { email: params.email },
    select: { id: true, email: true, passwordHash: true },
  })

  if (!user?.email || !user.passwordHash) {
    return { resetUrl: null, emailSent: false }
  }

  const token = signPasswordResetToken({ userId: user.id, email: user.email })
  const resetUrl = new URL("/reset-password", getConfiguredAppOrigin(params.origin))
  resetUrl.searchParams.set("token", token)
  const resetUrlValue = resetUrl.toString()

  if (emailConfig) {
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl: resetUrlValue,
    })

    return {
      resetUrl: shouldExposeResetUrl ? resetUrlValue : null,
      emailSent: true,
    }
  }

  return { resetUrl: shouldExposeResetUrl ? resetUrlValue : null, emailSent: false }
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
