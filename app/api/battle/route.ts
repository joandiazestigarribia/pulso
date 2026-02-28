import { z } from "zod"
import { NextResponse } from "next/server"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { MissingDatabaseUrlError } from "@/lib/db"
import {
  createPendingBattle,
  ensureBattleCatalog,
  completeBattleVote,
  VoteError,
} from "@/lib/battle-store"

const voteRequestSchema = z
  .object({
    battleId: z.string().min(1),
    winnerId: z.string().min(1),
    loserId: z.string().min(1),
    userId: z.string().min(1).optional(),
  })
  .refine((payload) => payload.winnerId !== payload.loserId, {
    message: "winnerId and loserId must be different",
    path: ["winnerId"],
  })

export async function GET(request: Request) {
  try {
    await ensureBattleCatalog()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") ?? DEFAULT_USER_ID
    const battle = await createPendingBattle(userId)
    return NextResponse.json(battle)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json(
        { error: "Server database is not configured (missing DATABASE_URL)." },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: "Unexpected battle fetch failure" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const payload = voteRequestSchema.safeParse(await request.json())

  if (!payload.success) {
    return NextResponse.json(
      { error: payload.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const result = await completeBattleVote({
      battleId: payload.data.battleId,
      winnerId: payload.data.winnerId,
      loserId: payload.data.loserId,
      userId: payload.data.userId ?? DEFAULT_USER_ID,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json(
        { error: "Server database is not configured (missing DATABASE_URL)." },
        { status: 503 }
      )
    }

    if (error instanceof VoteError) {
      const statusByCode: Record<VoteError["code"], number> = {
        battle_not_found: 404,
        battle_already_completed: 409,
        battle_forbidden_user: 403,
        vote_does_not_match_battle: 400,
        track_not_found: 404,
        vote_same_track: 400,
      }

      return NextResponse.json({ error: error.message }, { status: statusByCode[error.code] })
    }

    return NextResponse.json({ error: "Unexpected vote failure" }, { status: 500 })
  }
}
