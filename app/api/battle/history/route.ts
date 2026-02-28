import { z } from "zod"
import { NextResponse } from "next/server"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { MissingDatabaseUrlError } from "@/lib/db"
import { resolveRequestIdentity } from "@/lib/identity"
import { getBattleHistory } from "@/lib/battle-store"

const historyQuerySchema = z.object({
  userId: z.string().min(1).optional(),
  trackId: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const identity = resolveRequestIdentity(request)
  const parsed = historyQuerySchema.safeParse({
    userId:
      searchParams.get("userId") ?? identity.userId ?? identity.anonymousId ?? DEFAULT_USER_ID,
    trackId: searchParams.get("trackId") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const history = await getBattleHistory(parsed.data)
    return NextResponse.json(history)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json(
        { error: "Server database is not configured (missing DATABASE_URL)." },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: "Unexpected history fetch failure" }, { status: 500 })
  }
}
