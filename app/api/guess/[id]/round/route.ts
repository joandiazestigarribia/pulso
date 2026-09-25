import { z } from "zod"
import { NextResponse } from "next/server"
import { applyRateLimitHeaders, consumeRateLimit } from "@/lib/auth-rate-limit"
import { MissingDatabaseUrlError } from "@/lib/db"
import { resolveRequestIdentity } from "@/lib/request-identity"
import { getCurrentRound, PlaylistError, playlistErrorStatus, submitAnswer } from "@/lib/guess-store"

interface RouteContext {
  params: Promise<{ id: string }>
}

const answerSchema = z.object({
  roundIndex: z.number().int().min(0),
  chosenTrackId: z.string().min(1),
})

function resolvePlayerUserId(request: Request): string | null {
  const identity = resolveRequestIdentity(request)
  return identity.userId ?? identity.anonymousId
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params

  try {
    const playerUserId = resolvePlayerUserId(request)
    if (!playerUserId) {
      return NextResponse.json({ error: "Necesitás empezar el juego primero.", code: "missing_identity" }, { status: 401 })
    }

    const state = await getCurrentRound(id, playerUserId)
    return NextResponse.json(state)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json({ error: "La base de datos del servidor no está configurada." }, { status: 503 })
    }
    if (error instanceof PlaylistError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: playlistErrorStatus(error.code) })
    }

    return NextResponse.json({ error: "Error inesperado al cargar la ronda." }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params

  const rateLimit = consumeRateLimit(request, "guess:submit-answer", { limit: 60, windowMs: 60_000 })
  if (!rateLimit.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Demasiadas respuestas en poco tiempo. Probá de nuevo en un momento.", code: "too_many_requests" },
        { status: 429 }
      ),
      rateLimit
    )
  }

  const payload = answerSchema.safeParse(await request.json())
  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const playerUserId = resolvePlayerUserId(request)
    if (!playerUserId) {
      return NextResponse.json({ error: "Necesitás empezar el juego primero.", code: "missing_identity" }, { status: 401 })
    }

    const result = await submitAnswer(id, playerUserId, payload.data.roundIndex, payload.data.chosenTrackId)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json({ error: "La base de datos del servidor no está configurada." }, { status: 503 })
    }
    if (error instanceof PlaylistError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: playlistErrorStatus(error.code) })
    }

    return NextResponse.json({ error: "Error inesperado al guardar tu respuesta." }, { status: 500 })
  }
}
