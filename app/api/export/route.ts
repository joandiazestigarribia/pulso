import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { trackConversionEventSafe } from "@/lib/conversion-events"

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Use POST /api/export to validate auth/export gate.",
    },
    { status: 405 }
  )
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? null
  const hasSpotifyAccessToken = Boolean(session?.spotifyAccessToken)
  const spotifyTokenError = session?.spotifyTokenError ?? null
  await trackConversionEventSafe({
    eventName: "export_started",
    request,
    userId,
    metadata: {
      hasSession: Boolean(userId),
      hasSpotifyAccessToken,
      spotifyTokenError,
    },
  })

  if (!userId) {
    return NextResponse.json(
      { ok: false, code: "AUTH_REQUIRED", message: "Authentication required for export." },
      { status: 401 }
    )
  }

  if (!hasSpotifyAccessToken) {
    return NextResponse.json(
      { ok: false, code: "SPOTIFY_NOT_CONNECTED", message: "Connect Spotify to export playlists." },
      { status: 403 }
    )
  }

  if (spotifyTokenError) {
    return NextResponse.json(
      {
        ok: false,
        code: "SPOTIFY_TOKEN_REFRESH_FAILED",
        message: "Spotify token refresh failed. Please reconnect your account.",
      },
      { status: 401 }
    )
  }

  await trackConversionEventSafe({
    eventName: "export_completed",
    request,
    userId,
    metadata: {
      status: "gated_passed",
    },
  })

  return NextResponse.json({
    ok: true,
    message: "Export is gated and authenticated. Playlist creation is handled in F7.",
    userId,
  })
}
