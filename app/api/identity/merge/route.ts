import { NextResponse } from "next/server"
import { mergeAnonymousBattlesToUser } from "@/lib/auth"
import { resolveRequestIdentity } from "@/lib/request-identity"
import { trackConversionEventSafe } from "@/lib/conversion-events"

export async function POST(request: Request) {
  const identity = resolveRequestIdentity(request)
  const targetUserId = identity.userId

  if (!targetUserId) {
    return NextResponse.json(
      { ok: false, code: "AUTH_REQUIRED", message: "Necesitás iniciar sesión." },
      { status: 401 }
    )
  }

  const result = await mergeAnonymousBattlesToUser({
    anonymousId: identity.anonymousId,
    targetUserId,
  })

  await trackConversionEventSafe({
    eventName: "merge_completed",
    request,
    userId: targetUserId,
    anonymousId: identity.anonymousId,
    metadata: {
      sourceAnonymousId: result.sourceAnonymousId,
      movedBattles: result.movedBattles,
      merged: result.merged,
      status: result.status,
      auditId: result.auditId,
      method: "identity_merge_endpoint",
    },
  })

  return NextResponse.json({ ok: true, merge: result })
}
