import { NextResponse } from "next/server"
import { MOCK_TRACKS } from "@/lib/mock-data"

export async function GET() {
  const sorted = [...MOCK_TRACKS].sort((a, b) => b.eloScore - a.eloScore)
  return NextResponse.json(sorted)
}
