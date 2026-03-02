import { z } from "zod"
import { NextResponse } from "next/server"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { MissingDatabaseUrlError } from "@/lib/db"
import { resolveRequestIdentity } from "@/lib/identity"
import { getMusicProfileState } from "@/lib/music-profile"

const insightsQuerySchema = z.object({
  userId: z.string().min(1).optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const identity = resolveRequestIdentity(request)

  const parsed = insightsQuerySchema.safeParse({
    userId:
      searchParams.get("userId") ?? identity.userId ?? identity.anonymousId ?? DEFAULT_USER_ID,
  })

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_INPUT",
        message: "Invalid profile insights request.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  try {
    const profileState = await getMusicProfileState(parsed.data.userId ?? DEFAULT_USER_ID)
    return NextResponse.json({
      ok: true,
      data: {
        unlockThreshold: profileState.unlockThreshold,
        completedBattlesCount: profileState.completedBattlesCount,
        unlocked: profileState.unlocked,
        teaser: profileState.teaser,
        hasCachedProfile: profileState.profile !== null,
        error: profileState.error,
      },
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
        message: "Unexpected profile insights failure.",
      },
      { status: 500 }
    )
  }
}

