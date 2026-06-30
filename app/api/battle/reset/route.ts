import { NextResponse } from "next/server"
import { MissingDatabaseUrlError } from "@/lib/db"
import { resolveRequestIdentity } from "@/lib/request-identity"
import { resetUserBattleProgress } from "@/lib/battle-store"

export async function POST(request: Request) {
  const identity = resolveRequestIdentity(request)
  const actorId = identity.userId ?? identity.anonymousId

  if (!actorId) {
    return NextResponse.json(
      {
        ok: false,
        code: "UNAUTHORIZED",
        message: "Necesitás una sesión para reiniciar el progreso de batalla.",
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
          message: "La base de datos del servidor no está configurada.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        ok: false,
        code: "UNEXPECTED_ERROR",
        message: "Error inesperado al reiniciar el progreso.",
      },
      { status: 500 }
    )
  }
}
