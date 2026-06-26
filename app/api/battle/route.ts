import { z } from "zod"
import { NextResponse } from "next/server"
import { DEFAULT_USER_ID } from "@/lib/constants"
import { MissingDatabaseUrlError } from "@/lib/db"
import {
  ANON_SESSION_COOKIE,
  buildAnonSessionId,
  resolveRequestIdentity,
  shouldUseSecureCookies,
} from "@/lib/identity"
import {
  BattleCatalogError,
  createPendingBattle,
  ensureBattleCatalog,
  completeBattleVote,
  getUserBattleStats,
  VoteError,
} from "@/lib/battle-store"
import { trackConversionEventSafe } from "@/lib/conversion-events"
import { MUSIC_DNA_UNLOCK_THRESHOLD } from "@/lib/music-dna-config"

const voteRequestSchema = z
  .object({
    battleId: z.string().min(1),
    winnerId: z.string().min(1),
    loserId: z.string().min(1),
    userId: z.string().min(1).optional(),
  })
  .refine((payload) => payload.winnerId !== payload.loserId, {
    message: "winnerId and loserId must be different",
    path: ["winnerId"],
  })

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const shouldRefreshCatalog = searchParams.get("refreshCatalog") === "1"
    await ensureBattleCatalog({ forceRefresh: shouldRefreshCatalog })

    const identity = resolveRequestIdentity(request)
    const userId =
      searchParams.get("userId") ?? identity.userId ?? identity.anonymousId ?? buildAnonSessionId()
    const battle = await createPendingBattle(userId)
    const response = NextResponse.json(battle)
    const source = searchParams.get("source") ?? "direct"

    void trackConversionEventSafe({
      eventName: "battle_started",
      request,
      userId: identity.userId,
      anonymousId: identity.userId ? null : userId,
      battleId: battle.id,
      metadata: {
        source,
      },
    })

    if (!identity.userId && !identity.anonymousId) {
      response.cookies.set(ANON_SESSION_COOKIE, userId, {
        httpOnly: true,
        sameSite: "lax",
        secure: shouldUseSecureCookies(request),
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    return response
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json(
        { error: "La base de datos del servidor no está configurada." },
        { status: 503 }
      )
    }

    if (error instanceof BattleCatalogError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    return NextResponse.json({ error: "Error inesperado al cargar el duelo." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const payload = voteRequestSchema.safeParse(await request.json())

  if (!payload.success) {
    return NextResponse.json(
      { error: payload.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const identity = resolveRequestIdentity(request)
    const actorId = identity.userId ?? identity.anonymousId ?? payload.data.userId ?? DEFAULT_USER_ID

    const result = await completeBattleVote({
      battleId: payload.data.battleId,
      winnerId: payload.data.winnerId,
      loserId: payload.data.loserId,
      userId: actorId,
    })

    void trackConversionEventSafe({
      eventName: "vote_submitted",
      request,
      userId: identity.userId,
      anonymousId: identity.userId ? null : actorId,
      battleId: payload.data.battleId,
      metadata: {
        winnerId: payload.data.winnerId,
        loserId: payload.data.loserId,
      },
    })

    const stats = await getUserBattleStats(actorId)
    const profileUnlock = {
      justUnlocked: stats.completedBattlesCount === MUSIC_DNA_UNLOCK_THRESHOLD,
      completedBattlesCount: stats.completedBattlesCount,
      threshold: MUSIC_DNA_UNLOCK_THRESHOLD,
    }

    if (profileUnlock.justUnlocked) {
      void trackConversionEventSafe({
        eventName: "profile_unlock_reached",
        request,
        userId: identity.userId,
        anonymousId: identity.userId ? null : actorId,
        battleId: payload.data.battleId,
        metadata: {
          completedBattlesCount: profileUnlock.completedBattlesCount,
          threshold: profileUnlock.threshold,
        },
      })
    }

    return NextResponse.json({ ...result, profileUnlock })
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json(
        { error: "La base de datos del servidor no está configurada." },
        { status: 503 }
      )
    }

    if (error instanceof VoteError) {
      const statusByCode: Record<VoteError["code"], number> = {
        battle_not_found: 404,
        battle_already_completed: 409,
        battle_forbidden_user: 403,
        vote_does_not_match_battle: 400,
        track_not_found: 404,
        vote_same_track: 400,
      }

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: statusByCode[error.code] }
      )
    }

    return NextResponse.json({ error: "Error inesperado al guardar el voto." }, { status: 500 })
  }
}
