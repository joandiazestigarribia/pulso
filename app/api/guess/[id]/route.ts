import { NextResponse } from "next/server"
import { MissingDatabaseUrlError } from "@/lib/db"
import { resolveRequestIdentity } from "@/lib/request-identity"
import { getOwnedPlaylistDetail, PlaylistError, playlistErrorStatus } from "@/lib/guess-store"

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

    const playlist = await getOwnedPlaylistDetail(id, ownerUserId)
    return NextResponse.json(playlist)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json({ error: "La base de datos del servidor no está configurada." }, { status: 503 })
    }
    if (error instanceof PlaylistError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: playlistErrorStatus(error.code) })
    }

    return NextResponse.json({ error: "Error inesperado al cargar la lista." }, { status: 500 })
  }
}
