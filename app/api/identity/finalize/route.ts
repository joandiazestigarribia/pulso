import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { getServerSession } from "next-auth"
import { mergeAnonymousBattlesToUser } from "@/lib/auth"
import {
  ANON_SESSION_COOKIE,
  AUTH_USER_COOKIE,
  resolveRequestIdentity,
  shouldUseSecureCookies,
} from "@/lib/identity"
import { authOptions } from "@/lib/next-auth"
import { MissingDatabaseUrlError } from "@/lib/db"

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Use POST /api/identity/finalize after Spotify callback.",
    },
    { status: 405 }
  )
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const appUserId = session?.user?.id

    if (!appUserId) {
      return NextResponse.json(
        { ok: false, code: "AUTH_REQUIRED", message: "Spotify session required." },
        { status: 401 }
      )
    }

    const identity = resolveRequestIdentity(request)
    const merge = await mergeAnonymousBattlesToUser({
      anonymousId: identity.anonymousId,
      targetUserId: appUserId,
    })

    const response = NextResponse.json({
      ok: true,
      userId: appUserId,
      merge,
      spotifyTokenError: session.spotifyTokenError,
    })

    response.cookies.set(AUTH_USER_COOKIE, appUserId, {
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureCookies(request),
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    response.cookies.delete(ANON_SESSION_COOKIE)
    return response
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json(
        { ok: false, code: "DB_NOT_CONFIGURED", message: "Database is not configured." },
        { status: 503 }
      )
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2021") {
        return NextResponse.json(
          {
            ok: false,
            code: "DB_SCHEMA_OUTDATED",
            message:
              "Database schema is outdated. Run migrations (npx prisma migrate deploy) and retry.",
          },
          { status: 500 }
        )
      }
    }

    console.error("[identity/finalize] unexpected error", error)
    return NextResponse.json(
      { ok: false, code: "FINALIZE_FAILED", message: "Could not finalize Spotify login." },
      { status: 500 }
    )
  }
}
