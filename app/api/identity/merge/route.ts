import { z } from "zod"
import { NextResponse } from "next/server"
import { mergeAnonymousBattlesToUser } from "@/lib/auth"
import {
  ANON_SESSION_COOKIE,
  AUTH_USER_COOKIE,
  resolveRequestIdentity,
  shouldUseSecureCookies,
} from "@/lib/identity"
import { trackConversionEventSafe } from "@/lib/conversion-events"

const mergeRequestSchema = z.object({
  userId: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
})

export async function POST(request: Request) {
  const payload = mergeRequestSchema.safeParse(await request.json())

  if (!payload.success) {
    return NextResponse.json(
      { ok: false, code: "INVALID_INPUT", message: "Invalid merge payload." },
      { status: 400 }
    )
  }

  const identity = resolveRequestIdentity(request)
  const targetUserId = payload.data.userId ?? identity.userId

  if (!targetUserId) {
    return NextResponse.json(
      { ok: false, code: "AUTH_REQUIRED", message: "Authentication required." },
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

  const response = NextResponse.json({ ok: true, merge: result })
  response.cookies.set(AUTH_USER_COOKIE, targetUserId, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(request),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
  response.cookies.delete(ANON_SESSION_COOKIE)
  return response
}
