import { z } from "zod"
import { NextResponse } from "next/server"
import { MissingDatabaseUrlError } from "@/lib/db"
import { resolveRequestIdentity } from "@/lib/identity"
import { getMusicProfileState } from "@/lib/music-profile"

const regenerateSchema = z.object({
  forceRegenerate: z.literal(true),
})

function unauthorizedResponse() {
  return NextResponse.json(
    {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Necesitás iniciar sesión para acceder al perfil completo.",
    },
    { status: 401 }
  )
}

export async function GET(request: Request) {
  const identity = resolveRequestIdentity(request)
  if (!identity.userId) {
    return unauthorizedResponse()
  }

  try {
    const profileState = await getMusicProfileState(identity.userId)
    return NextResponse.json({
      ok: true,
      data: profileState,
    })
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json(
        {
          ok: false,
          code: "DB_NOT_CONFIGURED",
          message: "La base de datos del servidor no está configurada.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        ok: false,
        code: "UNEXPECTED_ERROR",
        message: "Error inesperado al cargar el perfil completo.",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const identity = resolveRequestIdentity(request)
  if (!identity.userId) {
    return unauthorizedResponse()
  }

  const payload = regenerateSchema.safeParse(await request.json())
  if (!payload.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_INPUT",
        message: "Solicitud de regeneración inválida.",
        errors: payload.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  try {
    const profileState = await getMusicProfileState(identity.userId, {
      forceRegenerate: payload.data.forceRegenerate,
    })

    return NextResponse.json({
      ok: true,
      data: profileState,
    })
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json(
        {
          ok: false,
          code: "DB_NOT_CONFIGURED",
          message: "La base de datos del servidor no está configurada.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        ok: false,
        code: "UNEXPECTED_ERROR",
        message: "Error inesperado al regenerar el perfil.",
      },
      { status: 500 }
    )
  }
}
