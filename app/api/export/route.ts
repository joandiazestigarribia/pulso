import { NextResponse } from "next/server"
import { resolveRequestIdentity } from "@/lib/identity"
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
  const identity = resolveRequestIdentity(request)
  const userId = identity.userId
  await trackConversionEventSafe({
    eventName: "export_started",
    request,
    userId,
    metadata: {
      hasSession: Boolean(userId),
    },
  })

  if (!userId) {
    return NextResponse.json(
      { ok: false, code: "AUTH_REQUIRED", message: "Authentication required for export." },
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
    message: "Export is gated and authenticated. Playlist creation is handled in F7 Deezer export.",
    userId,
  })
}
