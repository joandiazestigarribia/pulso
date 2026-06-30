import { z } from "zod"
import { NextResponse } from "next/server"
import { requireAdminAccess } from "@/lib/admin-auth"
import { getConversionFunnelMetrics } from "@/lib/conversion-events"

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
})

export async function GET(request: Request) {
  const adminAccess = requireAdminAccess(request)
  if (!adminAccess.allowed) {
    return NextResponse.json(adminAccess.body, { status: adminAccess.status })
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({
    days: searchParams.get("days") ?? 7,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "INVALID_QUERY", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const now = new Date()
  const from = new Date(now.getTime() - parsed.data.days * 24 * 60 * 60 * 1000)
  const metrics = await getConversionFunnelMetrics({
    from,
    to: now,
  })

  return NextResponse.json({ ok: true, metrics })
}
