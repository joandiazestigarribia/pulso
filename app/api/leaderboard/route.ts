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
        { error: "Server database is not configured (missing DATABASE_URL)." },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: "Unexpected leaderboard fetch failure" }, { status: 500 })
  }
}
