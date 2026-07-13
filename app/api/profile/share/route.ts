import { NextResponse } from "next/server"
import { MissingDatabaseUrlError } from "@/lib/db"
import {
  buildProfileShareImageUrl,
  buildProfileShareUrl,
  createProfileShareToken,
  getPublicProfileShare,
} from "@/lib/profile-share"
import { resolveRequestIdentity } from "@/lib/request-identity"

function getRequestOrigin(request: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
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
    const token = createProfileShareToken(identity.userId)
    const share = await getPublicProfileShare(token)
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
