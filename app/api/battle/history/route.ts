import { z } from "zod"
import { NextResponse } from "next/server"
import { MissingDatabaseUrlError } from "@/lib/db"
import { resolveRequestIdentity } from "@/lib/request-identity"
import { getBattleHistory } from "@/lib/battle-store"

const historyQuerySchema = z.object({
  trackId: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const identity = resolveRequestIdentity(request)
  const parsed = historyQuerySchema.safeParse({
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
    const history = await getBattleHistory({
      ...parsed.data,
      userId: identity.userId ?? identity.anonymousId ?? undefined,
    })
    return NextResponse.json(history)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json(
        { error: "La base de datos del servidor no está configurada." },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: "Error inesperado al cargar el historial." }, { status: 500 })
  }
}
