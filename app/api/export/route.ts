import { NextResponse } from "next/server"
import { resolveRequestIdentity } from "@/lib/request-identity"
import { trackConversionEventSafe } from "@/lib/conversion-events"

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Usá POST /api/export para validar el acceso de exportación.",
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
      { ok: false, code: "AUTH_REQUIRED", message: "Necesitás iniciar sesión para exportar." },
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
    message: "La exportación está protegida y autenticada. La creación de playlists se maneja en F7 Deezer export.",
    userId,
  })
}
