import { NextResponse } from "next/server"
import { applyRateLimitHeaders, consumeRateLimit } from "@/lib/auth-rate-limit"
import { MissingDatabaseUrlError } from "@/lib/db"
import { resolveRequestIdentity } from "@/lib/request-identity"
import { PlaylistError, playlistErrorStatus, previewPublishRounds, publishPlaylist } from "@/lib/guess-store"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params

  try {
    const identity = resolveRequestIdentity(request)
    const ownerUserId = identity.userId ?? identity.anonymousId
    if (!ownerUserId) {
      return NextResponse.json({ error: "Necesitás una sesión para ver esta lista.", code: "missing_identity" }, { status: 401 })
    }

    const preview = await previewPublishRounds(id, ownerUserId)
    return NextResponse.json(preview)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json({ error: "La base de datos del servidor no está configurada." }, { status: 503 })
    }
    if (error instanceof PlaylistError) {
      return NextResponse.json({ error: error.message, code: error.code, meta: error.meta }, { status: playlistErrorStatus(error.code) })
    }

    return NextResponse.json({ error: "Error inesperado al generar la vista previa." }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params

  const rateLimit = consumeRateLimit(request, "guess:publish-playlist", { limit: 10, windowMs: 60_000 })
  if (!rateLimit.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Demasiados intentos de publicación en poco tiempo. Probá de nuevo en un momento.", code: "too_many_requests" },
        { status: 429 }
      ),
      rateLimit
    )
  }

  try {
    const identity = resolveRequestIdentity(request)
    const ownerUserId = identity.userId ?? identity.anonymousId
    if (!ownerUserId) {
      return NextResponse.json({ error: "Necesitás una sesión para publicar esta lista.", code: "missing_identity" }, { status: 401 })
    }

    const playlist = await publishPlaylist(id, ownerUserId)
    return NextResponse.json(playlist)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json({ error: "La base de datos del servidor no está configurada." }, { status: 503 })
    }
    if (error instanceof PlaylistError) {
      return NextResponse.json({ error: error.message, code: error.code, meta: error.meta }, { status: playlistErrorStatus(error.code) })
    }

    return NextResponse.json({ error: "Error inesperado al publicar la lista." }, { status: 500 })
  }
}
