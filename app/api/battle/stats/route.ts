import { z } from "zod"
import { NextResponse } from "next/server"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { getUserBattleStats } from "@/lib/battle-store"

const statsQuerySchema = z.object({
  userId: z.string().min(1).optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = statsQuerySchema.safeParse({
    userId: searchParams.get("userId") ?? DEFAULT_USER_ID,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const stats = getUserBattleStats(parsed.data.userId ?? DEFAULT_USER_ID)
  return NextResponse.json(stats)
}
