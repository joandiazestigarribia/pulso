import { NextResponse } from "next/server"
import { mergeAnonymousBattlesToUser } from "@/lib/auth"
import { applyRateLimitHeaders, consumeRateLimit } from "@/lib/auth-rate-limit"
import { resolveRequestIdentity } from "@/lib/request-identity"
import { sanitizeLogData } from "@/lib/sanitize-logs"
import { trackConversionEventSafe } from "@/lib/conversion-events"

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit(request, "identity:merge", { limit: 10, windowMs: 60_000 })
  if (!rateLimit.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { ok: false, code: "TOO_MANY_REQUESTS", message: "Demasiadas solicitudes. Probá de nuevo en un momento." },
        { status: 429 }
      ),
      rateLimit
    )
  }

  const identity = resolveRequestIdentity(request)
  const targetUserId = identity.userId

  if (!targetUserId) {
    return NextResponse.json(
      { ok: false, code: "AUTH_REQUIRED", message: "Necesitás iniciar sesión." },
      { status: 401 }
    )
  }

  let result
  try {
    result = await mergeAnonymousBattlesToUser({
      anonymousId: identity.anonymousId,
      targetUserId,
    })
  } catch (error) {
    console.error("[identity/merge] unexpected error", sanitizeLogData(error))
    return NextResponse.json(
      { ok: false, code: "MERGE_FAILED", message: "No pudimos vincular tu progreso. Probá de nuevo." },
      { status: 500 }
    )
  }

  await trackConversionEventSafe({
    eventName: "merge_completed",
    request,
    userId: targetUserId,
    anonymousId: identity.anonymousId,
    metadata: {
      sourceAnonymousId: result.sourceAnonymousId,
      movedBattles: result.movedBattles,
      movedPlaylists: result.movedPlaylists,
      movedAttempts: result.movedAttempts,
      merged: result.merged,
      status: result.status,
      auditId: result.auditId,
      method: "identity_merge_endpoint",
    },
  })

  return NextResponse.json({ ok: true, merge: result })
}
