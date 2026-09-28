import { z } from "zod"
import { NextResponse } from "next/server"
import { applyRateLimitHeaders, consumeRateLimit } from "@/lib/auth-rate-limit"
import { MissingDatabaseUrlError } from "@/lib/db"
import { ANON_SESSION_COOKIE, buildAnonSessionId, shouldUseSecureCookies } from "@/lib/identity"
import { resolveRequestIdentity } from "@/lib/request-identity"
import { readJsonBody } from "@/lib/read-json-body"
import { createDraftPlaylist, listOwnedPlaylists } from "@/lib/guess-store"

const createPlaylistSchema = z.object({
  title: z.string().min(1).max(80),
})

export async function GET(request: Request) {
  try {
    const identity = resolveRequestIdentity(request)
    const ownerUserId = identity.userId ?? identity.anonymousId
    if (!ownerUserId) {
      return NextResponse.json([])
    }

    const playlists = await listOwnedPlaylists(ownerUserId)
    return NextResponse.json(playlists)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json({ error: "La base de datos del servidor no está configurada." }, { status: 503 })
    }

    return NextResponse.json({ error: "Error inesperado al cargar tus listas." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit(request, "guess:create-playlist", { limit: 10, windowMs: 60_000 })
  if (!rateLimit.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Demasiadas listas creadas en poco tiempo. Probá de nuevo en un momento.", code: "too_many_requests" },
        { status: 429 }
      ),
      rateLimit
    )
  }

  const rawBody = await readJsonBody(request)
  if (!rawBody.ok) {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 })
  }

  const payload = createPlaylistSchema.safeParse(rawBody.data)
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const identity = resolveRequestIdentity(request)
    const ownerUserId = identity.userId ?? identity.anonymousId ?? buildAnonSessionId()
    const playlist = await createDraftPlaylist(ownerUserId, payload.data.title)

    const response = NextResponse.json(playlist, { status: 201 })
    if (!identity.userId && !identity.anonymousId) {
      response.cookies.set(ANON_SESSION_COOKIE, ownerUserId, {
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

    return NextResponse.json({ error: "Error inesperado al crear la lista." }, { status: 500 })
  }
}
