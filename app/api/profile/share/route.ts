import { NextResponse } from "next/server"
import { MissingDatabaseUrlError } from "@/lib/db"
import { buildProfileShareImageUrl, buildProfileShareUrl, createProfileShare } from "@/lib/profile-share"
import { resolveRequestIdentity } from "@/lib/request-identity"

const SHARER_NAME_MAX_LENGTH = 60

function getRequestOrigin(request: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
}

async function readSharerName(request: Request): Promise<string | null> {
  const body = (await request.json().catch(() => null)) as { sharerName?: unknown } | null
  const sharerName = body?.sharerName
  if (typeof sharerName !== "string") {
    return null
  }

  return sharerName.trim().slice(0, SHARER_NAME_MAX_LENGTH) || null
}

export async function POST(request: Request) {
  const identity = resolveRequestIdentity(request)
  if (!identity.userId) {
    return NextResponse.json(
      {
        ok: false,
        code: "UNAUTHORIZED",
        message: "Necesitas iniciar sesion para compartir tu perfil sonoro.",
      },
      { status: 401 }
    )
  }

  try {
    const sharerName = await readSharerName(request)
    const share = await createProfileShare(identity.userId, sharerName)
    if (!share) {
      return NextResponse.json(
        {
          ok: false,
          code: "PROFILE_NOT_READY",
          message: "Tu perfil sonoro todavia no esta listo para compartir.",
        },
        { status: 409 }
      )
    }

    const origin = getRequestOrigin(request)
    const token = share.token

    return NextResponse.json({
      ok: true,
      data: {
        token,
        url: buildProfileShareUrl(origin, token),
        imageUrl: buildProfileShareImageUrl(origin, token),
      },
    })
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json(
        {
          ok: false,
          code: "DB_NOT_CONFIGURED",
          message: "La base de datos del servidor no esta configurada.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        ok: false,
        code: "UNEXPECTED_ERROR",
        message: "No se pudo preparar el link publico del perfil.",
      },
      { status: 500 }
    )
  }
}
