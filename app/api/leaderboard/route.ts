import { NextResponse } from "next/server"
import { getLeaderboardTracks } from "@/lib/battle-store"

export async function GET() {
  return NextResponse.json(getLeaderboardTracks())
}
