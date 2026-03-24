import { z } from "zod"
import { NextResponse } from "next/server"
import { MissingDatabaseUrlError } from "@/lib/db"
import { refreshTrackPreview } from "@/lib/battle-store"

const previewRefreshSchema = z.object({
  trackId: z.string().min(1),
})

export async function POST(request: Request) {
  const payload = previewRefreshSchema.safeParse(await request.json())
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid track id" }, { status: 400 })
  }

  try {
    const refreshed = await refreshTrackPreview(payload.data.trackId)
    return NextResponse.json({
      ok: true,
      trackId: refreshed.trackId,
      previewUrl: refreshed.previewUrl,
      previewSource: refreshed.previewSource,
    })
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json({ error: "Server database is not configured." }, { status: 503 })
    }

    return NextResponse.json({ error: "Could not refresh preview." }, { status: 500 })
  }
}
