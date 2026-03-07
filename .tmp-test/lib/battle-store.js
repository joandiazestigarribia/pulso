"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voteSchema = exports.BattleCatalogError = exports.VoteError = void 0;
exports.ensureBattleCatalog = ensureBattleCatalog;
exports.createPendingBattle = createPendingBattle;
exports.getCatalogDiagnostics = getCatalogDiagnostics;
exports.completeBattleVote = completeBattleVote;
exports.getBattleHistory = getBattleHistory;
exports.getUserBattleStats = getUserBattleStats;
exports.getLeaderboardTracks = getLeaderboardTracks;
const zod_1 = require("zod");
const db_1 = require("@/lib/db");
const elo_1 = require("@/lib/elo");
const mock_data_1 = require("@/lib/mock-data");
const spotify_1 = require("@/lib/spotify");
const catalog_curation_1 = require("@/lib/catalog-curation");
const catalog_policy_1 = require("@/lib/catalog-policy");
const MATCHMAKING_ELO_THRESHOLD = 200;
const SPOTIFY_REFRESH_MS = 1000 * 60 * 30;
const CATALOG_SYNC_LIMIT = 200;
const EXTERNAL_PREVIEW_TRACK_THRESHOLD = 8;
const LEGACY_PLACEHOLDER_PREVIEW_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";
const BLOCKED_PREVIEW_URL_FRAGMENTS = ["cdn.example.com", "tests.invalid", ".invalid/"];
const PREVIEW_BACKFILL_BATCH_SIZE = 50;
const PREVIEW_BACKFILL_MIN_INTERVAL_MS = 1000 * 30;
const PREVIEW_RECHECK_WINDOW_MS = 1000 * 60 * 60 * 24 * 7;
const DEFAULT_BUCKET = "general";
const ENABLE_STRICT_EXTERNAL_CATALOG_SYNC = true;
const INTRA_BUCKET_RATIO = 0.6;
const THEMATIC_DUEL_PROBABILITY = 0.3;
const USER_COOLDOWN_RECENT_BATTLES = 6;
const GLOBAL_EXPOSURE_RECENT_BATTLES = 250;
const MAX_RECENT_TITLE_EXPOSURE = 8;
const MAX_RECENT_ARTIST_EXPOSURE = 16;
const MAX_TRACKS_PER_ARTIST_IN_POOL = 3;
const BUCKET_MATCH_WEIGHTS = {
    classics_70s_80s_90s: 14,
    classics_00s_10s: 14,
    rock: 13,
    pop: 13,
    cumbia_latina: 12,
    urbano: 12,
    electronic: 11,
    indie_alt: 11,
    [DEFAULT_BUCKET]: 6,
};
const BUCKET_TARGET_SHARE = {
    classics_70s_80s_90s: 0.13,
    classics_00s_10s: 0.13,
    rock: 0.14,
    pop: 0.15,
    cumbia_latina: 0.12,
    urbano: 0.13,
    electronic: 0.1,
    indie_alt: 0.1,
    [DEFAULT_BUCKET]: 0,
};
class VoteError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
exports.VoteError = VoteError;
class BattleCatalogError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
exports.BattleCatalogError = BattleCatalogError;
exports.voteSchema = zod_1.z
    .object({
    battleId: zod_1.z.string().min(1),
    winnerId: zod_1.z.string().min(1),
    loserId: zod_1.z.string().min(1),
    userId: zod_1.z.string().min(1),
})
    .refine((payload) => payload.winnerId !== payload.loserId, {
    message: "winnerId and loserId must be different",
    path: ["winnerId"],
});
let lastSpotifySyncAt = 0;
let lastPreviewBackfillAt = 0;
let previewBackfillPromise = null;
function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}
function weightedRandomTrack(candidates) {
    const maxBattles = Math.max(...candidates.map((track) => track.battlesCount));
    const weighted = candidates.map((track) => ({
        track,
        weight: maxBattles - track.battlesCount + 1,
    }));
    const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let cursor = Math.random() * totalWeight;
    for (const entry of weighted) {
        cursor -= entry.weight;
        if (cursor <= 0) {
            return entry.track;
        }
    }
    return weighted[weighted.length - 1].track;
}
function buildDefaultMatchmakingContext() {
    return {
        userRecentArtistTokens: new Set(),
        userRecentTitleKeys: new Set(),
        globalArtistExposure: new Map(),
        globalTitleExposure: new Map(),
    };
}
async function countExternalPreviewTracks() {
    return db_1.prisma.track.count({
        where: {
            previewUrl: { not: null },
            previewSource: {
                in: ["spotify", "itunes"],
            },
        },
    });
}
function countTrackArtistExposure(track, exposureMap) {
    const tokens = (0, catalog_curation_1.extractArtistMatchTokens)(track.artist);
    let max = 0;
    for (const token of tokens) {
        max = Math.max(max, exposureMap.get(token) ?? 0);
    }
    return max;
}
function incrementMapCount(map, key) {
    map.set(key, (map.get(key) ?? 0) + 1);
}
function registerTrackInExposure(track, context) {
    incrementMapCount(context.globalTitleExposure, (0, catalog_curation_1.buildTrackTitleKey)(track));
    for (const token of (0, catalog_curation_1.extractArtistMatchTokens)(track.artist)) {
        incrementMapCount(context.globalArtistExposure, token);
    }
}
async function buildMatchmakingContext(userId) {
    const context = buildDefaultMatchmakingContext();
    const [recentUserBattles, recentGlobalBattles] = await Promise.all([
        db_1.prisma.battle.findMany({
            where: {
                userId,
                status: "COMPLETED",
            },
            include: {
                trackA: { select: { name: true, artist: true } },
                trackB: { select: { name: true, artist: true } },
            },
            orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
            take: USER_COOLDOWN_RECENT_BATTLES,
        }),
        db_1.prisma.battle.findMany({
            where: {
                status: "COMPLETED",
            },
            include: {
                trackA: { select: { name: true, artist: true } },
                trackB: { select: { name: true, artist: true } },
            },
            orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
            take: GLOBAL_EXPOSURE_RECENT_BATTLES,
        }),
    ]);
    for (const battle of recentUserBattles) {
        context.userRecentTitleKeys.add((0, catalog_curation_1.buildTrackTitleKey)(battle.trackA));
        context.userRecentTitleKeys.add((0, catalog_curation_1.buildTrackTitleKey)(battle.trackB));
        for (const token of (0, catalog_curation_1.extractArtistMatchTokens)(battle.trackA.artist)) {
            context.userRecentArtistTokens.add(token);
        }
        for (const token of (0, catalog_curation_1.extractArtistMatchTokens)(battle.trackB.artist)) {
            context.userRecentArtistTokens.add(token);
        }
    }
    for (const battle of recentGlobalBattles) {
        registerTrackInExposure(battle.trackA, context);
        registerTrackInExposure(battle.trackB, context);
    }
    return context;
}
function hasPreview(track) {
    return typeof track.previewUrl === "string" && track.previewUrl.trim().length > 0;
}
function trackBucket(track) {
    return track.catalogBucket ?? DEFAULT_BUCKET;
}
function weightedRandomKey(entries) {
    const positiveEntries = entries.filter((entry) => entry.weight > 0);
    if (positiveEntries.length === 0) {
        return entries[entries.length - 1]?.key ?? DEFAULT_BUCKET;
    }
    const totalWeight = positiveEntries.reduce((sum, entry) => sum + entry.weight, 0);
    let cursor = Math.random() * totalWeight;
    for (const entry of positiveEntries) {
        cursor -= entry.weight;
        if (cursor <= 0) {
            return entry.key;
        }
    }
    return positiveEntries[positiveEntries.length - 1].key;
}
function passesArtistCooldown(track, context) {
    if (context.userRecentArtistTokens.size === 0) {
        return true;
    }
    return !(0, catalog_curation_1.extractArtistMatchTokens)(track.artist).some((token) => context.userRecentArtistTokens.has(token));
}
function passesTitleCooldown(track, context) {
    if (context.userRecentTitleKeys.size === 0) {
        return true;
    }
    return !context.userRecentTitleKeys.has((0, catalog_curation_1.buildTrackTitleKey)(track));
}
function isTrackOverexposed(track, context) {
    const titleExposure = context.globalTitleExposure.get((0, catalog_curation_1.buildTrackTitleKey)(track)) ?? 0;
    if (titleExposure >= MAX_RECENT_TITLE_EXPOSURE) {
        return true;
    }
    return countTrackArtistExposure(track, context.globalArtistExposure) >= MAX_RECENT_ARTIST_EXPOSURE;
}
function applyUserCooldownFilter(tracks, context) {
    const titleAndArtistFiltered = tracks.filter((track) => passesTitleCooldown(track, context) && passesArtistCooldown(track, context));
    if (titleAndArtistFiltered.length >= 2) {
        return titleAndArtistFiltered;
    }
    const artistOnlyFiltered = tracks.filter((track) => passesArtistCooldown(track, context));
    if (artistOnlyFiltered.length >= 2) {
        return artistOnlyFiltered;
    }
    return tracks;
}
function applyExposureFilter(tracks, context) {
    const filtered = tracks.filter((track) => !isTrackOverexposed(track, context));
    if (filtered.length >= 2) {
        return filtered;
    }
    return tracks;
}
function capArtistPresence(tracks, maxTracksPerArtist) {
    if (tracks.length <= 2) {
        return tracks;
    }
    const countsByToken = new Map();
    const accepted = [];
    const overflow = [];
    for (const track of tracks) {
        const tokens = (0, catalog_curation_1.extractArtistMatchTokens)(track.artist);
        const primaryToken = tokens[0];
        if (!primaryToken) {
            accepted.push(track);
            continue;
        }
        const currentCount = countsByToken.get(primaryToken) ?? 0;
        if (currentCount < maxTracksPerArtist) {
            countsByToken.set(primaryToken, currentCount + 1);
            accepted.push(track);
            continue;
        }
        overflow.push(track);
    }
    if (accepted.length < 2) {
        return tracks;
    }
    return [...accepted, ...overflow];
}
function computeBucketShareByBattles(previewTracks) {
    const totalBattles = previewTracks.reduce((sum, track) => sum + track.battlesCount, 0);
    const byBucket = new Map();
    for (const track of previewTracks) {
        const bucket = trackBucket(track);
        byBucket.set(bucket, (byBucket.get(bucket) ?? 0) + track.battlesCount);
    }
    if (totalBattles <= 0) {
        return new Map();
    }
    const shareByBucket = new Map();
    for (const [bucket, battles] of byBucket.entries()) {
        shareByBucket.set(bucket, battles / totalBattles);
    }
    return shareByBucket;
}
function shareArtistTokens(trackA, trackB) {
    const trackATokens = new Set((0, catalog_curation_1.extractArtistMatchTokens)(trackA.artist));
    for (const token of (0, catalog_curation_1.extractArtistMatchTokens)(trackB.artist)) {
        if (trackATokens.has(token)) {
            return true;
        }
    }
    return false;
}
function shareTitleKey(trackA, trackB) {
    return (0, catalog_curation_1.buildTrackTitleKey)(trackA) === (0, catalog_curation_1.buildTrackTitleKey)(trackB);
}
const THEMATIC_DUELS = [
    {
        key: "nostalgia_vs_actual",
        leftLabel: "nostalgia",
        rightLabel: "actual",
        pickLeft: (track) => track.year <= 2008 ||
            trackBucket(track) === "classics_70s_80s_90s" ||
            trackBucket(track) === "classics_00s_10s",
        pickRight: (track) => track.year >= 2018 && ["pop", "urbano", "electronic", "indie_alt"].includes(trackBucket(track)),
    },
    {
        key: "fiesta_vs_chill",
        leftLabel: "fiesta",
        rightLabel: "chill",
        pickLeft: (track) => (track.energy ?? 0.6) >= 0.68 || (track.danceability ?? 0.55) >= 0.7 || ["urbano", "cumbia_latina", "electronic"].includes(trackBucket(track)),
        pickRight: (track) => (track.energy ?? 0.5) <= 0.48 && (track.valence ?? 0.5) <= 0.58,
    },
    {
        key: "rock_vs_urbano",
        leftLabel: "rock",
        rightLabel: "urbano",
        pickLeft: (track) => ["rock", "indie_alt"].includes(trackBucket(track)),
        pickRight: (track) => ["urbano", "pop", "cumbia_latina"].includes(trackBucket(track)),
    },
];
function selectThematicPair(previewTracks) {
    if (previewTracks.length < 2) {
        return null;
    }
    const candidateThemes = THEMATIC_DUELS.filter((theme) => {
        const leftCount = previewTracks.filter(theme.pickLeft).length;
        const rightCount = previewTracks.filter(theme.pickRight).length;
        return leftCount > 0 && rightCount > 0;
    });
    if (candidateThemes.length === 0) {
        return null;
    }
    const selectedTheme = randomItem(candidateThemes);
    const leftPool = previewTracks.filter(selectedTheme.pickLeft);
    const rightPool = previewTracks.filter(selectedTheme.pickRight);
    if (leftPool.length === 0 || rightPool.length === 0) {
        return null;
    }
    const trackA = weightedRandomTrack(leftPool);
    const filteredRight = rightPool.filter((track) => track.id !== trackA.id && !shareArtistTokens(trackA, track) && !shareTitleKey(trackA, track));
    const closeCandidates = filteredRight.filter((track) => Math.abs(track.eloScore - trackA.eloScore) < MATCHMAKING_ELO_THRESHOLD);
    if (closeCandidates.length > 0) {
        return { trackA, trackB: randomItem(closeCandidates) };
    }
    if (filteredRight.length > 0) {
        return { trackA, trackB: weightedRandomTrack(filteredRight) };
    }
    const fallbackRight = rightPool.filter((track) => track.id !== trackA.id);
    if (fallbackRight.length > 0) {
        return { trackA, trackB: weightedRandomTrack(fallbackRight) };
    }
    return null;
}
function selectPairWithinPool(pool) {
    const firstTrack = weightedRandomTrack(pool);
    const candidatePool = pool.filter((track) => track.id !== firstTrack.id);
    const preferredCandidates = candidatePool.filter((track) => !shareArtistTokens(firstTrack, track) && !shareTitleKey(firstTrack, track));
    const closeCandidates = preferredCandidates.filter((track) => Math.abs(track.eloScore - firstTrack.eloScore) < MATCHMAKING_ELO_THRESHOLD);
    if (closeCandidates.length > 0) {
        return { trackA: firstTrack, trackB: randomItem(closeCandidates) };
    }
    const fallbackCloseCandidates = candidatePool.filter((track) => Math.abs(track.eloScore - firstTrack.eloScore) < MATCHMAKING_ELO_THRESHOLD);
    if (fallbackCloseCandidates.length > 0) {
        return { trackA: firstTrack, trackB: randomItem(fallbackCloseCandidates) };
    }
    const fallbackCandidates = preferredCandidates.length > 0 ? preferredCandidates : candidatePool;
    return { trackA: firstTrack, trackB: weightedRandomTrack(fallbackCandidates) };
}
function selectWeightedBucket(buckets, excludedBuckets = new Set(), currentShareByBucket = new Map()) {
    const entries = [];
    for (const [bucket, bucketTracks] of buckets.entries()) {
        if (excludedBuckets.has(bucket) || bucketTracks.length === 0) {
            continue;
        }
        const configuredWeight = BUCKET_MATCH_WEIGHTS[bucket] ?? BUCKET_MATCH_WEIGHTS[DEFAULT_BUCKET];
        const targetShare = BUCKET_TARGET_SHARE[bucket] ?? BUCKET_TARGET_SHARE[DEFAULT_BUCKET];
        const currentShare = currentShareByBucket.get(bucket) ?? 0;
        const targetBoost = targetShare > 0 ? Math.max(0.2, 1 + (targetShare - currentShare) * 3) : 1;
        const totalBattles = bucketTracks.reduce((sum, track) => sum + track.battlesCount, 0);
        const averageBattles = totalBattles / bucketTracks.length;
        const exposurePenalty = 1 / (averageBattles + 1);
        const capacityBoost = Math.min(2, 1 + Math.log10(bucketTracks.length + 1));
        entries.push({
            key: bucket,
            weight: configuredWeight * exposurePenalty * capacityBoost * targetBoost,
        });
    }
    if (entries.length === 0) {
        return null;
    }
    return weightedRandomKey(entries);
}
function selectCrossBucketPair(previewTracks) {
    const byBucket = new Map();
    for (const track of previewTracks) {
        const bucket = trackBucket(track);
        const current = byBucket.get(bucket) ?? [];
        current.push(track);
        byBucket.set(bucket, current);
    }
    const currentShareByBucket = computeBucketShareByBattles(previewTracks);
    const firstBucket = selectWeightedBucket(byBucket, new Set(), currentShareByBucket);
    if (!firstBucket) {
        return selectPairWithinPool(previewTracks);
    }
    const secondBucket = selectWeightedBucket(byBucket, new Set([firstBucket]), currentShareByBucket);
    if (!secondBucket) {
        return selectPairWithinPool(previewTracks);
    }
    const firstPool = byBucket.get(firstBucket) ?? [];
    const secondPool = byBucket.get(secondBucket) ?? [];
    if (firstPool.length === 0 || secondPool.length === 0) {
        return selectPairWithinPool(previewTracks);
    }
    const trackA = weightedRandomTrack(firstPool);
    const closeCandidates = secondPool.filter((track) => Math.abs(track.eloScore - trackA.eloScore) < MATCHMAKING_ELO_THRESHOLD &&
        !shareArtistTokens(trackA, track) &&
        !shareTitleKey(trackA, track));
    if (closeCandidates.length > 0) {
        return { trackA, trackB: randomItem(closeCandidates) };
    }
    return { trackA, trackB: weightedRandomTrack(secondPool) };
}
function toTrack(track) {
    return {
        id: track.id,
        spotifyTrackId: track.spotifyTrackId,
        catalogBucket: track.catalogBucket,
        name: track.name,
        artist: track.artist,
        albumImage: track.albumImage,
        previewUrl: track.previewUrl,
        previewSource: track.previewSource,
        previewCheckedAt: track.previewCheckedAt?.toISOString() ?? null,
        spotifyPopularity: track.spotifyPopularity,
        spotifyExplicit: track.spotifyExplicit,
        spotifyPreviewAvailable: track.spotifyPreviewAvailable,
        eloScore: track.eloScore,
        battlesCount: track.battlesCount,
        bpm: track.bpm,
        duration: track.duration,
        genre: track.genre,
        year: track.year,
        energy: track.energy,
        valence: track.valence,
        danceability: track.danceability,
    };
}
function toBattleState(status) {
    return status;
}
async function seedCatalogIfEmpty() {
    (0, db_1.assertDatabaseConfigured)();
    const totalTracks = await db_1.prisma.track.count();
    if (totalTracks > 0) {
        return;
    }
    await db_1.prisma.$transaction(mock_data_1.MOCK_TRACKS.map((track) => db_1.prisma.track.upsert({
        where: { id: track.id },
        create: track,
        update: {
            catalogBucket: track.catalogBucket ?? DEFAULT_BUCKET,
            name: track.name,
            artist: track.artist,
            albumImage: track.albumImage,
            previewUrl: track.previewUrl,
            previewSource: track.previewSource,
            previewCheckedAt: track.previewCheckedAt,
            spotifyTrackId: track.spotifyTrackId,
            spotifyPopularity: track.spotifyPopularity,
            spotifyExplicit: track.spotifyExplicit,
            spotifyPreviewAvailable: track.spotifyPreviewAvailable,
            bpm: track.bpm,
            duration: track.duration,
            genre: track.genre,
            year: track.year,
            energy: track.energy,
            valence: track.valence,
            danceability: track.danceability,
        },
    })));
}
async function ensureUser(userId) {
    await db_1.prisma.user.upsert({
        where: { id: userId },
        create: { id: userId },
        update: {},
    });
}
async function sanitizeLegacyPlaceholderPreviews() {
    const blockedPreviewWhere = BLOCKED_PREVIEW_URL_FRAGMENTS.map((fragment) => ({
        previewUrl: { contains: fragment },
    }));
    await db_1.prisma.track.updateMany({
        where: {
            OR: [{ previewUrl: LEGACY_PLACEHOLDER_PREVIEW_URL }, ...blockedPreviewWhere],
        },
        data: {
            previewUrl: null,
            previewSource: null,
            previewCheckedAt: new Date(),
            spotifyPreviewAvailable: false,
        },
    });
}
async function normalizeLegacyPreviewSources() {
    await db_1.prisma.track.updateMany({
        where: {
            previewUrl: { not: null },
            previewSource: null,
            spotifyTrackId: { not: null },
        },
        data: {
            previewSource: "spotify",
            previewCheckedAt: new Date(),
        },
    });
    await db_1.prisma.track.updateMany({
        where: {
            previewUrl: { not: null },
            previewSource: null,
            spotifyTrackId: null,
        },
        data: {
            previewSource: "itunes",
            previewCheckedAt: new Date(),
        },
    });
}
async function backfillMissingPreviewUrls() {
    const recheckCutoff = new Date(Date.now() - PREVIEW_RECHECK_WINDOW_MS);
    const tracksMissingPreview = await db_1.prisma.track.findMany({
        where: {
            previewUrl: null,
            OR: [{ previewCheckedAt: null }, { previewCheckedAt: { lt: recheckCutoff } }],
        },
        select: {
            id: true,
            name: true,
            artist: true,
        },
        take: PREVIEW_BACKFILL_BATCH_SIZE,
    });
    for (const track of tracksMissingPreview) {
        const checkedAt = new Date();
        const previewUrl = await (0, spotify_1.fetchItunesPreviewUrl)({
            trackName: track.name,
            artistName: track.artist,
        });
        await db_1.prisma.track.update({
            where: { id: track.id },
            data: {
                previewUrl: previewUrl ?? null,
                previewSource: previewUrl ? "itunes" : null,
                previewCheckedAt: checkedAt,
            },
        });
    }
}
async function suppressStaleExternalTracks(activeTrackIds) {
    if (!ENABLE_STRICT_EXTERNAL_CATALOG_SYNC ||
        activeTrackIds.length < EXTERNAL_PREVIEW_TRACK_THRESHOLD) {
        return;
    }
    await db_1.prisma.track.updateMany({
        where: {
            previewSource: {
                in: ["spotify", "itunes"],
            },
            id: {
                notIn: activeTrackIds,
            },
        },
        data: {
            previewUrl: null,
            previewSource: null,
            previewCheckedAt: new Date(),
            spotifyPreviewAvailable: false,
        },
    });
}
function hasTrackPreview(track) {
    return typeof track.previewUrl === "string" && track.previewUrl.trim().length > 0;
}
function triggerPreviewBackfillInBackground() {
    if (previewBackfillPromise) {
        return;
    }
    if (Date.now() - lastPreviewBackfillAt < PREVIEW_BACKFILL_MIN_INTERVAL_MS) {
        return;
    }
    previewBackfillPromise = backfillMissingPreviewUrls()
        .catch(() => undefined)
        .finally(() => {
        lastPreviewBackfillAt = Date.now();
        previewBackfillPromise = null;
    });
}
function selectBattlePair(tracks, artistDenylist, context, options) {
    const applyCooldownFilters = options?.applyCooldownFilters ?? true;
    const allPreviewTracks = tracks.filter((track) => hasPreview(track));
    const curatedPreviewTracks = allPreviewTracks.filter((track) => (0, catalog_curation_1.isTrackAllowedByManualCuration)(track) &&
        !(0, catalog_policy_1.isArtistBlocked)(track.artist, artistDenylist));
    const basePreviewTracks = curatedPreviewTracks.length >= 2 ? curatedPreviewTracks : allPreviewTracks;
    const rawPreviewTracks = applyCooldownFilters
        ? applyExposureFilter(applyUserCooldownFilter(basePreviewTracks, context), context)
        : basePreviewTracks;
    const previewTracks = capArtistPresence(rawPreviewTracks, MAX_TRACKS_PER_ARTIST_IN_POOL);
    if (previewTracks.length >= 2) {
        if (Math.random() < THEMATIC_DUEL_PROBABILITY) {
            const thematicPair = selectThematicPair(previewTracks);
            if (thematicPair) {
                return thematicPair;
            }
        }
        const byBucket = new Map();
        for (const track of previewTracks) {
            const bucket = trackBucket(track);
            const current = byBucket.get(bucket) ?? [];
            current.push(track);
            byBucket.set(bucket, current);
        }
        const shouldUseIntraBucket = Math.random() < INTRA_BUCKET_RATIO;
        const currentShareByBucket = computeBucketShareByBattles(previewTracks);
        const selectedBucket = selectWeightedBucket(byBucket, new Set(), currentShareByBucket);
        if (shouldUseIntraBucket && selectedBucket) {
            const bucketTracks = byBucket.get(selectedBucket) ?? [];
            if (bucketTracks.length >= 2) {
                return selectPairWithinPool(bucketTracks);
            }
        }
        return selectCrossBucketPair(previewTracks);
    }
    throw new BattleCatalogError("insufficient_preview_tracks", "Catalog does not have enough tracks with preview audio right now.");
}
async function ensureBattleCatalog(options) {
    (0, db_1.assertDatabaseConfigured)();
    await seedCatalogIfEmpty();
    await sanitizeLegacyPlaceholderPreviews();
    await normalizeLegacyPreviewSources();
    triggerPreviewBackfillInBackground();
    const forceRefresh = options?.forceRefresh ?? false;
    const artistDenylist = await (0, catalog_policy_1.getActiveArtistDenylist)();
    const externalPreviewTrackCount = await countExternalPreviewTracks();
    const hasHealthyExternalCatalog = externalPreviewTrackCount >= EXTERNAL_PREVIEW_TRACK_THRESHOLD;
    if (!forceRefresh && Date.now() - lastSpotifySyncAt < SPOTIFY_REFRESH_MS && hasHealthyExternalCatalog) {
        return;
    }
    const spotifyTracks = (await (0, spotify_1.fetchSpotifyBattleTracks)(CATALOG_SYNC_LIMIT)).filter((track) => !(0, catalog_policy_1.isArtistBlocked)(track.artist, artistDenylist));
    const spotifyPreviewTracks = spotifyTracks.filter((track) => hasTrackPreview(track));
    if (spotifyPreviewTracks.length < 2) {
        const itunesTracks = (await (0, spotify_1.fetchItunesBattleTracks)(CATALOG_SYNC_LIMIT)).filter((track) => !(0, catalog_policy_1.isArtistBlocked)(track.artist, artistDenylist));
        if (itunesTracks.length >= 2) {
            await db_1.prisma.$transaction(itunesTracks.map((track) => db_1.prisma.track.upsert({
                where: { id: track.id },
                create: {
                    ...track,
                    catalogBucket: track.catalogBucket ?? DEFAULT_BUCKET,
                    previewSource: track.previewSource ?? (track.previewUrl ? "itunes" : null),
                    previewCheckedAt: new Date(),
                },
                update: {
                    catalogBucket: track.catalogBucket ?? DEFAULT_BUCKET,
                    name: track.name,
                    artist: track.artist,
                    albumImage: track.albumImage,
                    ...(hasTrackPreview(track)
                        ? {
                            previewUrl: track.previewUrl,
                            previewSource: track.previewSource ?? "itunes",
                            previewCheckedAt: new Date(),
                        }
                        : {}),
                    spotifyTrackId: track.spotifyTrackId,
                    spotifyPopularity: track.spotifyPopularity,
                    spotifyExplicit: track.spotifyExplicit,
                    spotifyPreviewAvailable: track.spotifyPreviewAvailable,
                    bpm: track.bpm,
                    duration: track.duration,
                    genre: track.genre,
                    year: track.year,
                    energy: track.energy,
                    valence: track.valence,
                    danceability: track.danceability,
                },
            })));
            await suppressStaleExternalTracks(itunesTracks.filter((track) => hasTrackPreview(track)).map((track) => track.id));
            lastSpotifySyncAt = Date.now();
        }
        triggerPreviewBackfillInBackground();
        return;
    }
    await db_1.prisma.$transaction(spotifyTracks.map((track) => db_1.prisma.track.upsert({
        where: { id: track.id },
        create: {
            ...track,
            catalogBucket: track.catalogBucket ?? DEFAULT_BUCKET,
            previewSource: track.previewUrl ? "spotify" : null,
            previewCheckedAt: new Date(),
        },
        update: {
            catalogBucket: track.catalogBucket ?? DEFAULT_BUCKET,
            name: track.name,
            artist: track.artist,
            albumImage: track.albumImage,
            ...(hasTrackPreview(track)
                ? {
                    previewUrl: track.previewUrl,
                    previewSource: "spotify",
                    previewCheckedAt: new Date(),
                }
                : {}),
            spotifyTrackId: track.spotifyTrackId,
            spotifyPopularity: track.spotifyPopularity,
            spotifyExplicit: track.spotifyExplicit,
            spotifyPreviewAvailable: track.spotifyPreviewAvailable,
            bpm: track.bpm,
            duration: track.duration,
            genre: track.genre,
            year: track.year,
            energy: track.energy,
            valence: track.valence,
            danceability: track.danceability,
        },
    })));
    await suppressStaleExternalTracks(spotifyPreviewTracks.map((track) => track.id));
    lastSpotifySyncAt = Date.now();
    triggerPreviewBackfillInBackground();
}
async function createPendingBattle(userId) {
    (0, db_1.assertDatabaseConfigured)();
    await seedCatalogIfEmpty();
    await ensureUser(userId);
    const artistDenylist = await (0, catalog_policy_1.getActiveArtistDenylist)(true);
    const externalPreviewTrackCount = await countExternalPreviewTracks();
    const hasHealthyExternalCatalog = externalPreviewTrackCount >= EXTERNAL_PREVIEW_TRACK_THRESHOLD;
    const matchmakingContext = hasHealthyExternalCatalog
        ? await buildMatchmakingContext(userId)
        : buildDefaultMatchmakingContext();
    const trackRows = await db_1.prisma.track.findMany();
    if (trackRows.length < 2) {
        throw new Error("At least two tracks are required to create a battle");
    }
    const tracks = trackRows.map(toTrack);
    const { trackA, trackB } = selectBattlePair(tracks, artistDenylist, matchmakingContext, {
        applyCooldownFilters: hasHealthyExternalCatalog,
    });
    const battle = await db_1.prisma.battle.create({
        data: {
            userId,
            trackAId: trackA.id,
            trackBId: trackB.id,
            status: "PENDING",
        },
    });
    return {
        id: battle.id,
        trackA,
        trackB,
        userId: battle.userId,
        status: toBattleState(battle.status),
        winnerId: null,
        createdAt: battle.createdAt.toISOString(),
        completedAt: null,
    };
}
async function getCatalogDiagnostics() {
    (0, db_1.assertDatabaseConfigured)();
    const [tracks, recentBattles] = await Promise.all([
        db_1.prisma.track.findMany({
            select: {
                id: true,
                name: true,
                artist: true,
                catalogBucket: true,
                previewUrl: true,
                previewSource: true,
                battlesCount: true,
                eloScore: true,
            },
        }),
        db_1.prisma.battle.findMany({
            where: { status: "COMPLETED" },
            include: {
                trackA: {
                    select: {
                        id: true,
                    },
                },
                trackB: {
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
            take: 300,
        }),
    ]);
    const bucketAggregate = new Map();
    const sourceAggregate = new Map();
    const artistAggregate = new Map();
    const recentExposureByTrackId = new Map();
    for (const battle of recentBattles) {
        recentExposureByTrackId.set(battle.trackA.id, (recentExposureByTrackId.get(battle.trackA.id) ?? 0) + 1);
        recentExposureByTrackId.set(battle.trackB.id, (recentExposureByTrackId.get(battle.trackB.id) ?? 0) + 1);
    }
    for (const track of tracks) {
        const bucket = track.catalogBucket ?? DEFAULT_BUCKET;
        const bucketStats = bucketAggregate.get(bucket) ?? { total: 0, preview: 0, battles: 0 };
        bucketStats.total += 1;
        bucketStats.battles += track.battlesCount;
        if (typeof track.previewUrl === "string" && track.previewUrl.trim().length > 0) {
            bucketStats.preview += 1;
        }
        bucketAggregate.set(bucket, bucketStats);
        const normalizedArtist = (0, catalog_curation_1.normalizeCatalogText)(track.artist);
        if (normalizedArtist.length > 0) {
            artistAggregate.set(normalizedArtist, (artistAggregate.get(normalizedArtist) ?? 0) + 1);
        }
        const source = track.previewSource ?? "none";
        sourceAggregate.set(source, (sourceAggregate.get(source) ?? 0) + 1);
    }
    const previewTracks = tracks.filter((track) => Boolean(track.previewUrl)).length;
    const buckets = Array.from(bucketAggregate.entries())
        .map(([bucket, stats]) => ({
        bucket,
        totalTracks: stats.total,
        previewTracks: stats.preview,
        averageBattlesCount: stats.total > 0 ? Number((stats.battles / stats.total).toFixed(2)) : 0,
    }))
        .sort((a, b) => b.totalTracks - a.totalTracks);
    const sources = Array.from(sourceAggregate.entries())
        .map(([source, totalTracks]) => ({ source, totalTracks }))
        .sort((a, b) => b.totalTracks - a.totalTracks);
    const topArtistsByCatalogSize = Array.from(artistAggregate.entries())
        .map(([artist, count]) => ({ artist, tracks: count }))
        .sort((a, b) => b.tracks - a.tracks)
        .slice(0, 20);
    const topTracksByExposure = tracks
        .map((track) => ({
        trackId: track.id,
        name: track.name,
        artist: track.artist,
        bucket: track.catalogBucket ?? DEFAULT_BUCKET,
        previewSource: track.previewSource ?? null,
        battlesCount: track.battlesCount,
        eloScore: track.eloScore,
        recentBattleAppearances: recentExposureByTrackId.get(track.id) ?? 0,
    }))
        .sort((a, b) => {
        if (b.recentBattleAppearances !== a.recentBattleAppearances) {
            return b.recentBattleAppearances - a.recentBattleAppearances;
        }
        return b.battlesCount - a.battlesCount;
    })
        .slice(0, 30);
    return {
        generatedAt: new Date().toISOString(),
        totals: {
            tracks: tracks.length,
            previewTracks,
            previewCoverage: tracks.length > 0 ? Number((previewTracks / tracks.length).toFixed(4)) : 0,
        },
        buckets,
        sources,
        topArtistsByCatalogSize,
        topTracksByExposure,
    };
}
async function completeBattleVote(payload) {
    (0, db_1.assertDatabaseConfigured)();
    const { battleId, userId, winnerId, loserId } = payload;
    if (winnerId === loserId) {
        throw new VoteError("vote_same_track", "winnerId and loserId must be different");
    }
    return db_1.prisma.$transaction(async (tx) => {
        const battle = await tx.battle.findUnique({
            where: { id: battleId },
            include: {
                trackA: true,
                trackB: true,
            },
        });
        if (!battle) {
            throw new VoteError("battle_not_found", "Battle not found");
        }
        if (battle.status !== "PENDING") {
            throw new VoteError("battle_already_completed", "Battle already completed");
        }
        if (battle.userId !== userId) {
            throw new VoteError("battle_forbidden_user", "Battle does not belong to user");
        }
        const validIds = [battle.trackAId, battle.trackBId];
        if (!validIds.includes(winnerId) || !validIds.includes(loserId)) {
            throw new VoteError("vote_does_not_match_battle", "Vote does not match battle tracks");
        }
        const winner = battle.trackAId === winnerId
            ? battle.trackA
            : battle.trackBId === winnerId
                ? battle.trackB
                : null;
        const loser = battle.trackAId === loserId
            ? battle.trackA
            : battle.trackBId === loserId
                ? battle.trackB
                : null;
        if (!winner || !loser) {
            throw new VoteError("track_not_found", "Track not found");
        }
        const { newWinnerElo, newLoserElo } = (0, elo_1.calculateElo)(winner.eloScore, loser.eloScore);
        const winnerEloChange = newWinnerElo - winner.eloScore;
        const loserEloChange = newLoserElo - loser.eloScore;
        const completedAt = new Date();
        const lockedBattle = await tx.battle.updateMany({
            where: { id: battleId, status: "PENDING" },
            data: {
                status: "COMPLETED",
                winnerId,
                loserId,
                winnerEloChange,
                loserEloChange,
                completedAt,
            },
        });
        if (lockedBattle.count !== 1) {
            throw new VoteError("battle_already_completed", "Battle already completed");
        }
        const [updatedWinner, updatedLoser] = await Promise.all([
            tx.track.update({
                where: { id: winner.id },
                data: {
                    eloScore: newWinnerElo,
                    battlesCount: winner.battlesCount + 1,
                },
            }),
            tx.track.update({
                where: { id: loser.id },
                data: {
                    eloScore: newLoserElo,
                    battlesCount: loser.battlesCount + 1,
                },
            }),
        ]);
        return {
            battle: {
                id: battleId,
                status: "COMPLETED",
                winnerId,
                completedAt: completedAt.toISOString(),
            },
            winner: {
                id: updatedWinner.id,
                name: updatedWinner.name,
                newElo: updatedWinner.eloScore,
                eloChange: winnerEloChange,
                battlesCount: updatedWinner.battlesCount,
            },
            loser: {
                id: updatedLoser.id,
                name: updatedLoser.name,
                newElo: updatedLoser.eloScore,
                eloChange: loserEloChange,
                battlesCount: updatedLoser.battlesCount,
            },
        };
    });
}
async function getBattleHistory(params) {
    (0, db_1.assertDatabaseConfigured)();
    const limit = Math.max(1, params.limit ?? 20);
    const where = {
        status: "COMPLETED",
    };
    if (params.userId) {
        where.userId = params.userId;
    }
    if (params.trackId) {
        where.OR = [{ trackAId: params.trackId }, { trackBId: params.trackId }];
    }
    const battles = await db_1.prisma.battle.findMany({
        where,
        include: {
            trackA: true,
            trackB: true,
        },
        orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
    });
    return battles.flatMap((battle) => {
        if (!battle.winnerId || !battle.loserId || !battle.completedAt) {
            return [];
        }
        return [
            {
                battleId: battle.id,
                userId: battle.userId,
                status: toBattleState(battle.status),
                winnerId: battle.winnerId,
                loserId: battle.loserId,
                trackAId: battle.trackAId,
                trackBId: battle.trackBId,
                trackAName: battle.trackA.name,
                trackBName: battle.trackB.name,
                winnerEloChange: battle.winnerEloChange ?? 0,
                loserEloChange: battle.loserEloChange ?? 0,
                createdAt: battle.createdAt.toISOString(),
                completedAt: battle.completedAt.toISOString(),
            },
        ];
    });
}
async function getUserBattleStats(userId) {
    (0, db_1.assertDatabaseConfigured)();
    const completedBattlesCount = await db_1.prisma.battle.count({
        where: {
            userId,
            status: "COMPLETED",
        },
    });
    return { completedBattlesCount };
}
async function getLeaderboardTracks() {
    (0, db_1.assertDatabaseConfigured)();
    const tracks = await db_1.prisma.track.findMany({
        orderBy: [{ eloScore: "desc" }, { battlesCount: "asc" }],
    });
    return tracks.map(toTrack);
}
