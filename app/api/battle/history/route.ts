import { z } from "zod"
import { NextResponse } from "next/server"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { getBattleHistory } from "@/lib/battle-store"

const historyQuerySchema = z.object({
  userId: z.string().min(1).optional(),
  trackId: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = historyQuerySchema.safeParse({
    userId: searchParams.get("userId") ?? DEFAULT_USER_ID,
    trackId: searchParams.get("trackId") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const history = getBattleHistory(parsed.data)
  return NextResponse.json(history)
}
