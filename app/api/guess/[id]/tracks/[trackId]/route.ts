import { NextResponse } from "next/server"
import { applyRateLimitHeaders, consumeRateLimit } from "@/lib/auth-rate-limit"
import { MissingDatabaseUrlError } from "@/lib/db"
import { resolveRequestIdentity } from "@/lib/request-identity"
import { PlaylistError, playlistErrorStatus, removeTrackFromPlaylist } from "@/lib/guess-store"

interface RouteContext {
  params: Promise<{ id: string; trackId: string }>
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { id, trackId } = await params

  const rateLimit = consumeRateLimit(request, "guess:remove-track", { limit: 40, windowMs: 60_000 })
  if (!rateLimit.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Demasiadas canciones quitadas en poco tiempo. Probá de nuevo en un momento.", code: "too_many_requests" },
        { status: 429 }
      ),
      rateLimit
    )
  }

  try {
    const identity = resolveRequestIdentity(request)
    const ownerUserId = identity.userId ?? identity.anonymousId
    if (!ownerUserId) {
      return NextResponse.json({ error: "Necesitás una sesión para editar esta lista.", code: "missing_identity" }, { status: 401 })
    }

    const playlist = await removeTrackFromPlaylist(id, ownerUserId, trackId)
    return NextResponse.json(playlist)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json({ error: "La base de datos del servidor no está configurada." }, { status: 503 })
    }
    if (error instanceof PlaylistError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: playlistErrorStatus(error.code) })
    }

    return NextResponse.json({ error: "Error inesperado al sacar la canción." }, { status: 500 })
  }
}
