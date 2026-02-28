import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"

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

export async function POST() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, code: "AUTH_REQUIRED", message: "Authentication required for export." },
      { status: 401 }
    )
  }

  if (!session.spotifyAccessToken) {
    return NextResponse.json(
      { ok: false, code: "SPOTIFY_NOT_CONNECTED", message: "Connect Spotify to export playlists." },
      { status: 403 }
    )
  }

  if (session.spotifyTokenError) {
    return NextResponse.json(
      {
        ok: false,
        code: "SPOTIFY_TOKEN_REFRESH_FAILED",
        message: "Spotify token refresh failed. Please reconnect your account.",
      },
      { status: 401 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: "Export is gated and authenticated. Playlist creation is handled in F7.",
    userId: session.user.id,
  })
}
