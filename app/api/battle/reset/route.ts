import { NextResponse } from "next/server"
import { MissingDatabaseUrlError } from "@/lib/db"
import { resolveRequestIdentity } from "@/lib/identity"
import { resetUserBattleProgress } from "@/lib/battle-store"

export async function POST(request: Request) {
  const identity = resolveRequestIdentity(request)
  const actorId = identity.userId ?? identity.anonymousId

  if (!actorId) {
    return NextResponse.json(
      {
        ok: false,
        code: "UNAUTHORIZED",
        message: "Session identity is required to reset battle progress.",
      },
      { status: 401 }
    )
  }

  try {
    const result = await resetUserBattleProgress(actorId)
    return NextResponse.json({
      ok: true,
      data: result,
    })
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json(
        {
          ok: false,
          code: "DB_NOT_CONFIGURED",
          message: "Server database is not configured (missing DATABASE_URL).",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        ok: false,
        code: "UNEXPECTED_ERROR",
        message: "Unexpected reset failure.",
      },
      { status: 500 }
    )
  }
}

