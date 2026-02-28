import { z } from "zod"
import { NextResponse } from "next/server"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { MissingDatabaseUrlError } from "@/lib/db"
import { resolveRequestIdentity } from "@/lib/identity"
import { getUserBattleStats } from "@/lib/battle-store"

const statsQuerySchema = z.object({
  userId: z.string().min(1).optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const identity = resolveRequestIdentity(request)
  const parsed = statsQuerySchema.safeParse({
    userId:
      searchParams.get("userId") ?? identity.userId ?? identity.anonymousId ?? DEFAULT_USER_ID,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const stats = await getUserBattleStats(parsed.data.userId ?? DEFAULT_USER_ID)
    return NextResponse.json(stats)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json(
        { error: "Server database is not configured (missing DATABASE_URL)." },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: "Unexpected stats fetch failure" }, { status: 500 })
  }
}
