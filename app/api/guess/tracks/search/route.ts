import { NextResponse } from "next/server"
import { applyRateLimitHeaders, consumeRateLimit } from "@/lib/auth-rate-limit"
import { searchDeezerTracks } from "@/lib/catalog-providers"

export async function GET(request: Request) {
  const rateLimit = consumeRateLimit(request, "guess:search", { limit: 30, windowMs: 60_000 })
  if (!rateLimit.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Demasiadas búsquedas en poco tiempo. Probá de nuevo en un momento." }, { status: 429 }),
      rateLimit
    )
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim() ?? ""
  if (query.length < 2) {
    return NextResponse.json([])
  }

  const results = await searchDeezerTracks(query)
  return applyRateLimitHeaders(NextResponse.json(results), rateLimit)
}
