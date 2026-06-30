import { NextResponse } from "next/server"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { MissingDatabaseUrlError } from "@/lib/db"
import { resolveRequestIdentity } from "@/lib/request-identity"
import { getMusicProfileState } from "@/lib/music-profile"

export async function GET(request: Request) {
  const identity = resolveRequestIdentity(request)

  try {
    const profileState = await getMusicProfileState(identity.userId ?? identity.anonymousId ?? DEFAULT_USER_ID)
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
          message: "La base de datos del servidor no está configurada.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        ok: false,
        code: "UNEXPECTED_ERROR",
        message: "Error inesperado al cargar los insights del perfil.",
      },
      { status: 500 }
    )
  }
}
