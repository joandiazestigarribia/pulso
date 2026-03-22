import { NextResponse } from "next/server"

const FINALIZE_DEPRECATED_MESSAGE =
  "Identity finalize via external OAuth is deprecated. Use POST /api/identity/session with a callsign."

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      code: "IDENTITY_FINALIZE_DEPRECATED",
      message: FINALIZE_DEPRECATED_MESSAGE,
    },
    { status: 410 }
  )
}

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      code: "IDENTITY_FINALIZE_DEPRECATED",
      message: FINALIZE_DEPRECATED_MESSAGE,
    },
    { status: 410 }
  )
}
