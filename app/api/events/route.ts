import { z } from "zod"
import { NextResponse } from "next/server"
import { applyRateLimitHeaders, consumeRateLimit } from "@/lib/auth-rate-limit"
import { conversionEventNames, trackConversionEventSafe } from "@/lib/conversion-events"

const eventSchema = z.object({
  eventName: z.enum(conversionEventNames),
  battleId: z.string().min(1).max(191).optional(),
  variant: z.string().trim().min(1).max(64).optional(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
})

export async function POST(request: Request) {
  const rateLimit = consumeRateLimit(request, "conversion:event", { limit: 120, windowMs: 60_000 })
  if (!rateLimit.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { ok: false, code: "TOO_MANY_REQUESTS", message: "Demasiados eventos en poco tiempo." },
        { status: 429 }
      ),
      rateLimit
    )
  }

  const parsed = eventSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_INPUT",
        message: "Invalid conversion event payload.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  await trackConversionEventSafe({
    eventName: parsed.data.eventName,
    request,
    battleId: parsed.data.battleId ?? null,
    variant: parsed.data.variant ?? null,
    metadata: parsed.data.metadata ?? {},
  })

  return NextResponse.json({ ok: true })
}
