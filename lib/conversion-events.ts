import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { resolveRequestIdentity } from "@/lib/identity"

export const conversionEventNames = [
  "battle_started",
  "vote_submitted",
  "profile_teaser_viewed",
  "profile_unlock_reached",
  "auth_prompt_shown",
  "auth_completed",
  "merge_completed",
  "export_started",
  "export_completed",
] as const

export type ConversionEventName = (typeof conversionEventNames)[number]

type EventIdentity = {
  userId: string | null
  anonymousId: string | null
}

type TrackConversionEventInput = {
  eventName: ConversionEventName
  request?: Request
  userId?: string | null
  anonymousId?: string | null
  battleId?: string | null
  variant?: string | null
  metadata?: Prisma.InputJsonValue
}

type ConversionWindow = {
  from?: Date
  to?: Date
}

export type ConversionFunnelMetrics = {
  window: {
    from: string
    to: string
  }
  counts: Record<ConversionEventName, number>
  uniqueActors: {
    battleStarted: number
    firstVote: number
    authCompleted: number
    mergedFromAnonymous: number
  }
  rates: {
    firstVoteToAuth: number
  }
}

function toActorKey(identity: EventIdentity): string | null {
  if (identity.userId) {
    return `user:${identity.userId}`
  }

  if (identity.anonymousId) {
    return `anon:${identity.anonymousId}`
  }

  return null
}

function resolveEventIdentity(input: TrackConversionEventInput): EventIdentity {
  if (input.request) {
    const requestIdentity = resolveRequestIdentity(input.request)
    return {
      userId: input.userId ?? requestIdentity.userId,
      anonymousId: input.anonymousId ?? requestIdentity.anonymousId,
    }
  }

  return {
    userId: input.userId ?? null,
    anonymousId: input.anonymousId ?? null,
  }
}

export async function trackConversionEvent(input: TrackConversionEventInput): Promise<void> {
  const identity = resolveEventIdentity(input)

  await prisma.conversionEvent.create({
    data: {
      eventName: input.eventName,
      userId: identity.userId,
      anonymousId: identity.anonymousId,
      battleId: input.battleId ?? null,
      variant: input.variant ?? null,
      metadata: input.metadata,
    },
  })
}

export async function trackConversionEventSafe(input: TrackConversionEventInput): Promise<void> {
  try {
    await trackConversionEvent(input)
  } catch (error) {
    console.error("[conversion-events] failed to persist event", {
      eventName: input.eventName,
      error,
    })
  }
}

function normalizeWindow(window: ConversionWindow): { from: Date; to: Date } {
  const to = window.to ?? new Date()
  const from = window.from ?? new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000)
  return { from, to }
}

function clampRate(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(1, Number(value.toFixed(4))))
}

export async function getConversionFunnelMetrics(window: ConversionWindow = {}): Promise<ConversionFunnelMetrics> {
  const { from, to } = normalizeWindow(window)
  const where = {
    createdAt: {
      gte: from,
      lte: to,
    },
  }

  const [events, groupedByEvent] = await Promise.all([
    prisma.conversionEvent.findMany({
      where,
      select: {
        eventName: true,
        userId: true,
        anonymousId: true,
        metadata: true,
      },
    }),
    prisma.conversionEvent.groupBy({
      by: ["eventName"],
      where,
      _count: {
        _all: true,
      },
    }),
  ])

  const counts = conversionEventNames.reduce<Record<ConversionEventName, number>>((acc, eventName) => {
    acc[eventName] = 0
    return acc
  }, {} as Record<ConversionEventName, number>)

  for (const row of groupedByEvent) {
    counts[row.eventName as ConversionEventName] = row._count._all
  }

  const battleStartedActors = new Set<string>()
  const firstVoteActors = new Set<string>()
  const authActors = new Set<string>()
  const mergedAnonymousActors = new Set<string>()

  for (const event of events) {
    const actorKey = toActorKey({
      userId: event.userId,
      anonymousId: event.anonymousId,
    })

    if (event.eventName === "battle_started" && actorKey) {
      battleStartedActors.add(actorKey)
    }

    if (event.eventName === "vote_submitted" && actorKey) {
      firstVoteActors.add(actorKey)
    }

    if (event.eventName === "auth_completed" && actorKey) {
      authActors.add(actorKey)
    }

    if (event.eventName === "merge_completed" && event.metadata && typeof event.metadata === "object") {
      const sourceAnonymousId =
        "sourceAnonymousId" in event.metadata ? event.metadata.sourceAnonymousId : null
      if (typeof sourceAnonymousId === "string" && sourceAnonymousId.length > 0) {
        const anonActorKey = `anon:${sourceAnonymousId}`
        mergedAnonymousActors.add(anonActorKey)
        authActors.add(anonActorKey)
      }
    }
  }

  let convertedFromFirstVote = 0
  for (const firstVoteActor of firstVoteActors) {
    if (authActors.has(firstVoteActor)) {
      convertedFromFirstVote += 1
    }
  }

  return {
    window: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
    counts,
    uniqueActors: {
      battleStarted: battleStartedActors.size,
      firstVote: firstVoteActors.size,
      authCompleted: authActors.size,
      mergedFromAnonymous: mergedAnonymousActors.size,
    },
    rates: {
      firstVoteToAuth: clampRate(firstVoteActors.size > 0 ? convertedFromFirstVote / firstVoteActors.size : 0),
    },
  }
}
