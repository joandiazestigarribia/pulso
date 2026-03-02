"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversionEventNames = void 0;
exports.trackConversionEvent = trackConversionEvent;
exports.trackConversionEventSafe = trackConversionEventSafe;
exports.getConversionFunnelMetrics = getConversionFunnelMetrics;
const db_1 = require("@/lib/db");
const identity_1 = require("@/lib/identity");
exports.conversionEventNames = [
    "battle_started",
    "vote_submitted",
    "profile_teaser_viewed",
    "profile_unlock_reached",
    "auth_prompt_shown",
    "auth_completed",
    "merge_completed",
    "export_started",
    "export_completed",
];
function toActorKey(identity) {
    if (identity.userId) {
        return `user:${identity.userId}`;
    }
    if (identity.anonymousId) {
        return `anon:${identity.anonymousId}`;
    }
    return null;
}
function resolveEventIdentity(input) {
    if (input.request) {
        const requestIdentity = (0, identity_1.resolveRequestIdentity)(input.request);
        return {
            userId: input.userId ?? requestIdentity.userId,
            anonymousId: input.anonymousId ?? requestIdentity.anonymousId,
        };
    }
    return {
        userId: input.userId ?? null,
        anonymousId: input.anonymousId ?? null,
    };
}
async function trackConversionEvent(input) {
    const identity = resolveEventIdentity(input);
    await db_1.prisma.conversionEvent.create({
        data: {
            eventName: input.eventName,
            userId: identity.userId,
            anonymousId: identity.anonymousId,
            battleId: input.battleId ?? null,
            variant: input.variant ?? null,
            metadata: input.metadata,
        },
    });
}
async function trackConversionEventSafe(input) {
    try {
        await trackConversionEvent(input);
    }
    catch (error) {
        console.error("[conversion-events] failed to persist event", {
            eventName: input.eventName,
            error,
        });
    }
}
function normalizeWindow(window) {
    const to = window.to ?? new Date();
    const from = window.from ?? new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { from, to };
}
function clampRate(value) {
    if (!Number.isFinite(value)) {
        return 0;
    }
    return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}
async function getConversionFunnelMetrics(window = {}) {
    const { from, to } = normalizeWindow(window);
    const where = {
        createdAt: {
            gte: from,
            lte: to,
        },
    };
    const [events, groupedByEvent] = await Promise.all([
        db_1.prisma.conversionEvent.findMany({
            where,
            select: {
                eventName: true,
                userId: true,
                anonymousId: true,
                metadata: true,
            },
        }),
        db_1.prisma.conversionEvent.groupBy({
            by: ["eventName"],
            where,
            _count: {
                _all: true,
            },
        }),
    ]);
    const counts = exports.conversionEventNames.reduce((acc, eventName) => {
        acc[eventName] = 0;
        return acc;
    }, {});
    for (const row of groupedByEvent) {
        counts[row.eventName] = row._count._all;
    }
    const battleStartedActors = new Set();
    const firstVoteActors = new Set();
    const authActors = new Set();
    const mergedAnonymousActors = new Set();
    for (const event of events) {
        const actorKey = toActorKey({
            userId: event.userId,
            anonymousId: event.anonymousId,
        });
        if (event.eventName === "battle_started" && actorKey) {
            battleStartedActors.add(actorKey);
        }
        if (event.eventName === "vote_submitted" && actorKey) {
            firstVoteActors.add(actorKey);
        }
        if (event.eventName === "auth_completed" && actorKey) {
            authActors.add(actorKey);
        }
        if (event.eventName === "merge_completed" && event.metadata && typeof event.metadata === "object") {
            const sourceAnonymousId = "sourceAnonymousId" in event.metadata ? event.metadata.sourceAnonymousId : null;
            if (typeof sourceAnonymousId === "string" && sourceAnonymousId.length > 0) {
                const anonActorKey = `anon:${sourceAnonymousId}`;
                mergedAnonymousActors.add(anonActorKey);
                authActors.add(anonActorKey);
            }
        }
    }
    let convertedFromFirstVote = 0;
    for (const firstVoteActor of firstVoteActors) {
        if (authActors.has(firstVoteActor)) {
            convertedFromFirstVote += 1;
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
    };
}
