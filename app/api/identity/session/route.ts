import { NextResponse } from "next/server"
import { resolveRequestIdentity } from "@/lib/request-identity"

export async function GET(request: Request) {
  const identity = resolveRequestIdentity(request)

  return NextResponse.json({
    isAuthenticated: Boolean(identity.userId),
    userId: identity.userId,
    anonymousId: identity.anonymousId,
  })
}

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "La sesión se crea desde login o registro.",
    },
    { status: 405 }
  )
}
