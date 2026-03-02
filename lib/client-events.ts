"use client"

import type { ConversionEventName } from "@/lib/conversion-events"

type ClientEventPayload = {
  eventName: ConversionEventName
  battleId?: string
  variant?: string
  metadata?: Record<string, unknown>
}

export async function trackClientEvent(payload: ClientEventPayload): Promise<void> {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  } catch {
    // Analytics errors should never block user flow.
  }
}
