"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const zod_1 = require("zod");
const server_1 = require("next/server");
const constants_1 = require("@/lib/constants");
const db_1 = require("@/lib/db");
const identity_1 = require("@/lib/identity");
const battle_store_1 = require("@/lib/battle-store");
const conversion_events_1 = require("@/lib/conversion-events");
const music_dna_config_1 = require("@/lib/music-dna-config");
const voteRequestSchema = zod_1.z
    .object({
    battleId: zod_1.z.string().min(1),
    winnerId: zod_1.z.string().min(1),
    loserId: zod_1.z.string().min(1),
    userId: zod_1.z.string().min(1).optional(),
})
    .refine((payload) => payload.winnerId !== payload.loserId, {
    message: "winnerId and loserId must be different",
    path: ["winnerId"],
});
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const shouldRefreshCatalog = searchParams.get("refreshCatalog") === "1";
        await (0, battle_store_1.ensureBattleCatalog)({ forceRefresh: shouldRefreshCatalog });
        const identity = (0, identity_1.resolveRequestIdentity)(request);
        const userId = searchParams.get("userId") ?? identity.userId ?? identity.anonymousId ?? (0, identity_1.buildAnonSessionId)();
        const battle = await (0, battle_store_1.createPendingBattle)(userId);
        const response = server_1.NextResponse.json(battle);
        const source = searchParams.get("source") ?? "direct";
        await (0, conversion_events_1.trackConversionEventSafe)({
            eventName: "battle_started",
            request,
            userId: identity.userId,
            anonymousId: identity.userId ? null : userId,
            battleId: battle.id,
            metadata: {
                source,
            },
        });
        if (!identity.userId && !identity.anonymousId) {
            response.cookies.set(identity_1.ANON_SESSION_COOKIE, userId, {
                httpOnly: true,
                sameSite: "lax",
                secure: (0, identity_1.shouldUseSecureCookies)(request),
                path: "/",
                maxAge: 60 * 60 * 24 * 30,
            });
        }
        return response;
    }
    catch (error) {
        if (error instanceof db_1.MissingDatabaseUrlError) {
            return server_1.NextResponse.json({ error: "Server database is not configured (missing DATABASE_URL)." }, { status: 503 });
        }
        if (error instanceof battle_store_1.BattleCatalogError) {
            return server_1.NextResponse.json({ error: error.message }, { status: 503 });
        }
        return server_1.NextResponse.json({ error: "Unexpected battle fetch failure" }, { status: 500 });
    }
}
async function POST(request) {
    const payload = voteRequestSchema.safeParse(await request.json());
    if (!payload.success) {
        return server_1.NextResponse.json({ error: payload.error.flatten().fieldErrors }, { status: 400 });
    }
    try {
        const identity = (0, identity_1.resolveRequestIdentity)(request);
        const actorId = identity.userId ?? identity.anonymousId ?? payload.data.userId ?? constants_1.DEFAULT_USER_ID;
        const result = await (0, battle_store_1.completeBattleVote)({
            battleId: payload.data.battleId,
            winnerId: payload.data.winnerId,
            loserId: payload.data.loserId,
            userId: actorId,
        });
        await (0, conversion_events_1.trackConversionEventSafe)({
            eventName: "vote_submitted",
            request,
            userId: identity.userId,
            anonymousId: identity.userId ? null : actorId,
            battleId: payload.data.battleId,
            metadata: {
                winnerId: payload.data.winnerId,
                loserId: payload.data.loserId,
            },
        });
        const stats = await (0, battle_store_1.getUserBattleStats)(actorId);
        if (stats.completedBattlesCount >= music_dna_config_1.MUSIC_DNA_UNLOCK_THRESHOLD) {
            await (0, conversion_events_1.trackConversionEventSafe)({
                eventName: "profile_unlock_reached",
                request,
                userId: identity.userId,
                anonymousId: identity.userId ? null : actorId,
                battleId: payload.data.battleId,
                metadata: {
                    completedBattlesCount: stats.completedBattlesCount,
                    threshold: music_dna_config_1.MUSIC_DNA_UNLOCK_THRESHOLD,
                },
            });
        }
        return server_1.NextResponse.json(result);
    }
    catch (error) {
        if (error instanceof db_1.MissingDatabaseUrlError) {
            return server_1.NextResponse.json({ error: "Server database is not configured (missing DATABASE_URL)." }, { status: 503 });
        }
        if (error instanceof battle_store_1.VoteError) {
            const statusByCode = {
                battle_not_found: 404,
                battle_already_completed: 409,
                battle_forbidden_user: 403,
                vote_does_not_match_battle: 400,
                track_not_found: 404,
                vote_same_track: 400,
            };
            return server_1.NextResponse.json({ error: error.message, code: error.code }, { status: statusByCode[error.code] });
        }
        return server_1.NextResponse.json({ error: "Unexpected vote failure" }, { status: 500 });
    }
}
