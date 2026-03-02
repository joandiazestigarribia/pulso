import { z } from "zod"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ensureUserExists, mergeAnonymousBattlesToUser } from "@/lib/auth"
import {
  ANON_SESSION_COOKIE,
  AUTH_USER_COOKIE,
  resolveRequestIdentity,
  shouldUseSecureCookies,
} from "@/lib/identity"
import { authOptions } from "@/lib/next-auth"
import { trackConversionEventSafe } from "@/lib/conversion-events"

const sessionRequestSchema = z.object({
  userId: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/),
})

export async function GET(request: Request) {
  const identity = resolveRequestIdentity(request)
  const session = await getServerSession(authOptions)

  return NextResponse.json({
    isAuthenticated: Boolean(identity.userId),
    userId: identity.userId,
    anonymousId: identity.anonymousId,
    spotifyConnected: Boolean(session?.spotifyAccessToken),
    spotifyTokenError: session?.spotifyTokenError ?? null,
  })
}

export async function POST(request: Request) {
  const payload = sessionRequestSchema.safeParse(await request.json())

  if (!payload.success) {
    return NextResponse.json(
      { ok: false, code: "INVALID_INPUT", message: "Invalid user id." },
      { status: 400 }
    )
  }

  const identity = resolveRequestIdentity(request)
  const targetUserId = payload.data.userId

  await ensureUserExists(targetUserId)
  const mergeResult = await mergeAnonymousBattlesToUser({
    anonymousId: identity.anonymousId,
    targetUserId,
  })

  await trackConversionEventSafe({
    eventName: "auth_completed",
    request,
    userId: targetUserId,
    anonymousId: identity.anonymousId,
    metadata: {
      method: "callsign_session",
    },
  })

  await trackConversionEventSafe({
    eventName: "merge_completed",
    request,
    userId: targetUserId,
    anonymousId: identity.anonymousId,
    metadata: {
      sourceAnonymousId: mergeResult.sourceAnonymousId,
      movedBattles: mergeResult.movedBattles,
      merged: mergeResult.merged,
      status: mergeResult.status,
      auditId: mergeResult.auditId,
    },
  })

  const response = NextResponse.json({
    ok: true,
    userId: targetUserId,
    merge: mergeResult,
  })

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
