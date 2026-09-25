import { z } from "zod"
import { NextResponse } from "next/server"
import { applyRateLimitHeaders, consumeRateLimit } from "@/lib/auth-rate-limit"
import { MissingDatabaseUrlError } from "@/lib/db"
import { resolveRequestIdentity } from "@/lib/request-identity"
import { addTrackToPlaylist, PlaylistError, playlistErrorStatus } from "@/lib/guess-store"

interface RouteContext {
  params: Promise<{ id: string }>
}

const addTrackSchema = z.object({
  trackId: z.string().min(1),
})

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params

  const rateLimit = consumeRateLimit(request, "guess:add-track", { limit: 40, windowMs: 60_000 })
  if (!rateLimit.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Demasiadas canciones agregadas en poco tiempo. Probá de nuevo en un momento.", code: "too_many_requests" },
        { status: 429 }
      ),
      rateLimit
    )
  }

  const payload = addTrackSchema.safeParse(await request.json())
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const identity = resolveRequestIdentity(request)
    const ownerUserId = identity.userId ?? identity.anonymousId
    if (!ownerUserId) {
      return NextResponse.json({ error: "Necesitás una sesión para editar esta lista.", code: "missing_identity" }, { status: 401 })
    }

    const playlist = await addTrackToPlaylist(id, ownerUserId, payload.data.trackId)
    return NextResponse.json(playlist)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json({ error: "La base de datos del servidor no está configurada." }, { status: 503 })
    }
    if (error instanceof PlaylistError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: playlistErrorStatus(error.code) })
    }

    return NextResponse.json({ error: "Error inesperado al agregar la canción." }, { status: 500 })
  }
}
