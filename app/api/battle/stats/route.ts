import { z } from "zod"
import { NextResponse } from "next/server"
import { MissingDatabaseUrlError } from "@/lib/db"
import { resolveRequestIdentity } from "@/lib/request-identity"
import { getUserBattleStats } from "@/lib/battle-store"

const statsQuerySchema = z.object({
  _: z.string().optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const identity = resolveRequestIdentity(request)
  const parsed = statsQuerySchema.safeParse({
    _: searchParams.get("_") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const actorId = identity.userId ?? identity.anonymousId
    if (!actorId) {
      return NextResponse.json({ completedBattlesCount: 0 })
    }

    const stats = await getUserBattleStats(actorId)
    return NextResponse.json(stats)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json(
        { error: "La base de datos del servidor no está configurada." },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: "Error inesperado al cargar las estadísticas." }, { status: 500 })
  }
}
