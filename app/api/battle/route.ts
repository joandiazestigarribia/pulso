import { NextResponse } from "next/server"
import { MOCK_TRACKS } from "@/lib/mock-data"
import { calculateElo } from "@/lib/elo"

const tracks = MOCK_TRACKS.map((t) => ({ ...t }))

export async function GET() {
  const shuffled = [...tracks].sort(() => Math.random() - 0.5)
  
  const sorted = shuffled.sort(
    (a, b) => Math.abs(a.eloScore - 1500) - Math.abs(b.eloScore - 1500)
  )

  const maxIdx = Math.max(0, sorted.length - 2)
  const startIdx = Math.floor(Math.random() * (maxIdx + 1))
  const trackA = sorted[startIdx]
  const trackB = sorted[startIdx + 1] || sorted[0]

  if (trackA.id === trackB.id) {
    const alt = sorted.find((t) => t.id !== trackA.id)
    if (alt) {
      return NextResponse.json({
        id: Math.random().toString(36).substring(7),
        trackA,
        trackB: alt,
        winnerId: null,
      })
    }
  }

  return NextResponse.json({
    id: Math.random().toString(36).substring(7),
    trackA,
    trackB,
    winnerId: null,
  })
}

export async function POST(request: Request) {
  const { winnerId, loserId } = await request.json()

  const winner = tracks.find((t) => t.id === winnerId)
  const loser = tracks.find((t) => t.id === loserId)

  if (!winner || !loser) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 })
  }

  const { newWinnerElo, newLoserElo } = calculateElo(winner.eloScore, loser.eloScore)

  winner.eloScore = newWinnerElo
  winner.battlesCount += 1
  loser.eloScore = newLoserElo
  loser.battlesCount += 1

  return NextResponse.json({
    winner: { id: winner.id, name: winner.name, newElo: newWinnerElo, eloChange: newWinnerElo - (newWinnerElo - (newWinnerElo - winner.eloScore)) },
    loser: { id: loser.id, name: loser.name, newElo: newLoserElo },
  })
}
