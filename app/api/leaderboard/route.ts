import { NextResponse } from "next/server"
import { getLeaderboardTracks } from "@/lib/battle-store"
import { MissingDatabaseUrlError } from "@/lib/db"

export async function GET() {
  try {
    const tracks = await getLeaderboardTracks()
    return NextResponse.json(tracks)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json(
        { error: "La base de datos del servidor no está configurada." },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: "Error inesperado al cargar el ranking." }, { status: 500 })
  }
}
