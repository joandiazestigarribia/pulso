import { NextResponse } from "next/server"
import { MissingDatabaseUrlError } from "@/lib/db"
import { getLeaderboard } from "@/lib/guess-store"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params

  try {
    const leaderboard = await getLeaderboard(id)
    return NextResponse.json(leaderboard)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json({ error: "La base de datos del servidor no está configurada." }, { status: 503 })
    }

    return NextResponse.json({ error: "Error inesperado al cargar el ranking." }, { status: 500 })
  }
}
