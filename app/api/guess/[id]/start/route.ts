import { z } from "zod"
import { NextResponse } from "next/server"
import { applyRateLimitHeaders, consumeRateLimit } from "@/lib/auth-rate-limit"
import { MissingDatabaseUrlError } from "@/lib/db"
import { ANON_SESSION_COOKIE, buildAnonSessionId, shouldUseSecureCookies } from "@/lib/identity"
import { resolveRequestIdentity } from "@/lib/request-identity"
import { readJsonBody } from "@/lib/read-json-body"
import { PlaylistError, playlistErrorStatus, startAttempt } from "@/lib/guess-store"

interface RouteContext {
  params: Promise<{ id: string }>
}

const startSchema = z.object({
  nickname: z.string().min(1).max(40),
})

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params

  const rateLimit = consumeRateLimit(request, "guess:start-attempt", { limit: 20, windowMs: 60_000 })
  if (!rateLimit.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Demasiados intentos en poco tiempo. Probá de nuevo en un momento.", code: "too_many_requests" },
        { status: 429 }
      ),
      rateLimit
    )
  }

  const rawBody = await readJsonBody(request)
  if (!rawBody.ok) {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 })
  }

  const payload = startSchema.safeParse(rawBody.data)
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const identity = resolveRequestIdentity(request)
    const playerUserId = identity.userId ?? identity.anonymousId ?? buildAnonSessionId()
    const result = await startAttempt(id, playerUserId, payload.data.nickname)

    const response = NextResponse.json(result)
    if (!identity.userId && !identity.anonymousId) {
      response.cookies.set(ANON_SESSION_COOKIE, playerUserId, {
        httpOnly: true,
        sameSite: "lax",
        secure: shouldUseSecureCookies(request),
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    return response
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json({ error: "La base de datos del servidor no está configurada." }, { status: 503 })
    }
    if (error instanceof PlaylistError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: playlistErrorStatus(error.code) })
    }

    return NextResponse.json({ error: "Error inesperado al empezar el juego." }, { status: 500 })
  }
}
