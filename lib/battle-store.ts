import { Prisma, type BattleState as PrismaBattleState } from "@prisma/client"
import { z } from "zod"
import { assertDatabaseConfigured, prisma } from "@/lib/db"
import { calculateElo } from "@/lib/elo"
import { MOCK_TRACKS, type Battle, type BattleState, type Track } from "@/lib/mock-data"
import { fetchItunesBattleTracks, fetchItunesPreviewUrl, fetchSpotifyBattleTracks } from "@/lib/spotify"
import {
  buildTrackTitleKey,
  extractArtistMatchTokens,
  isTrackBlockedByCurationHeuristics,
} from "@/lib/catalog-curation"
import { getActiveArtistDenylist, isArtistBlocked } from "@/lib/catalog-policy"

const MATCHMAKING_ELO_THRESHOLD = 200
const SPOTIFY_REFRESH_MS = 1000 * 60 * 30
const LEGACY_PLACEHOLDER_PREVIEW_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3"
const BLOCKED_PREVIEW_URL_FRAGMENTS = ["cdn.example.com", "tests.invalid", ".invalid/"]
const PREVIEW_BACKFILL_BATCH_SIZE = 50
const PREVIEW_BACKFILL_MIN_INTERVAL_MS = 1000 * 30
const PREVIEW_RECHECK_WINDOW_MS = 1000 * 60 * 60 * 24 * 7
const DEFAULT_BUCKET = "general"
const INTRA_BUCKET_RATIO = 0.6
const THEMATIC_DUEL_PROBABILITY = 0.3
const USER_COOLDOWN_RECENT_BATTLES = 6
const GLOBAL_EXPOSURE_RECENT_BATTLES = 250
const MAX_RECENT_TITLE_EXPOSURE = 8
const MAX_RECENT_ARTIST_EXPOSURE = 16
const BUCKET_MATCH_WEIGHTS: Record<string, number> = {
  classics_70s_80s_90s: 14,
  classics_00s_10s: 14,
  rock: 13,
  pop: 13,
  cumbia_latina: 12,
  urbano: 12,
  electronic: 11,
  indie_alt: 11,
  [DEFAULT_BUCKET]: 6,
}

export interface BattleVotePayload {
  battleId: string
  winnerId: string
  loserId: string
  userId: string
}

export interface BattleHistoryEntry {
  battleId: string
  userId: string
  status: BattleState
  winnerId: string
  loserId: string
  trackAId: string
  trackBId: string
  trackAName: string
  trackBName: string
  winnerEloChange: number
  loserEloChange: number
  createdAt: string
  completedAt: string
}

export interface BattleVoteResult {
  battle: {
    id: string
    status: BattleState
    winnerId: string
    completedAt: string
  }
  winner: {
    id: string
    name: string
    newElo: number
    eloChange: number
    battlesCount: number
  }
  loser: {
    id: string
    name: string
    newElo: number
    eloChange: number
    battlesCount: number
  }
}

export type VoteErrorCode =
  | "battle_not_found"
  | "battle_already_completed"
  | "battle_forbidden_user"
  | "vote_does_not_match_battle"
  | "track_not_found"
  | "vote_same_track"

export class VoteError extends Error {
  readonly code: VoteErrorCode

  constructor(code: VoteErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

export type BattleCatalogErrorCode = "insufficient_preview_tracks"

export class BattleCatalogError extends Error {
  readonly code: BattleCatalogErrorCode

  constructor(code: BattleCatalogErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

export const voteSchema = z
  .object({
    battleId: z.string().min(1),
    winnerId: z.string().min(1),
    loserId: z.string().min(1),
    userId: z.string().min(1),
  })
  .refine((payload) => payload.winnerId !== payload.loserId, {
    message: "winnerId and loserId must be different",
    path: ["winnerId"],
  })

let lastSpotifySyncAt = 0
let lastPreviewBackfillAt = 0
let previewBackfillPromise: Promise<void> | null = null

interface MatchmakingContext {
  userRecentArtistTokens: Set<string>
  userRecentTitleKeys: Set<string>
  globalArtistExposure: Map<string, number>
  globalTitleExposure: Map<string, number>
}

interface ThematicDuelDefinition {
  key: "nostalgia_vs_actual" | "fiesta_vs_chill" | "rock_vs_urbano"
  leftLabel: string
  rightLabel: string
  pickLeft: (track: Track) => boolean
  pickRight: (track: Track) => boolean
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function weightedRandomTrack(candidates: Track[]): Track {
  const maxBattles = Math.max(...candidates.map((track) => track.battlesCount))
  const weighted = candidates.map((track) => ({
    track,
    weight: maxBattles - track.battlesCount + 1,
  }))

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0)
  let cursor = Math.random() * totalWeight

  for (const entry of weighted) {
    cursor -= entry.weight
    if (cursor <= 0) {
      return entry.track
    }
  }

  return weighted[weighted.length - 1].track
}

function buildDefaultMatchmakingContext(): MatchmakingContext {
  return {
    userRecentArtistTokens: new Set(),
    userRecentTitleKeys: new Set(),
    globalArtistExposure: new Map(),
    globalTitleExposure: new Map(),
  }
}

function countTrackArtistExposure(track: Track, exposureMap: Map<string, number>): number {
  const tokens = extractArtistMatchTokens(track.artist)
  let max = 0
  for (const token of tokens) {
    max = Math.max(max, exposureMap.get(token) ?? 0)
  }

  return max
}

function incrementMapCount(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1)
}

function registerTrackInExposure(track: Pick<Track, "name" | "artist">, context: MatchmakingContext): void {
  incrementMapCount(context.globalTitleExposure, buildTrackTitleKey(track))
  for (const token of extractArtistMatchTokens(track.artist)) {
    incrementMapCount(context.globalArtistExposure, token)
  }
}

async function buildMatchmakingContext(userId: string): Promise<MatchmakingContext> {
  const context = buildDefaultMatchmakingContext()

  const [recentUserBattles, recentGlobalBattles] = await Promise.all([
    prisma.battle.findMany({
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
    prisma.battle.findMany({
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
  ])

  for (const battle of recentUserBattles) {
    context.userRecentTitleKeys.add(buildTrackTitleKey(battle.trackA))
    context.userRecentTitleKeys.add(buildTrackTitleKey(battle.trackB))

    for (const token of extractArtistMatchTokens(battle.trackA.artist)) {
      context.userRecentArtistTokens.add(token)
    }

    for (const token of extractArtistMatchTokens(battle.trackB.artist)) {
      context.userRecentArtistTokens.add(token)
    }
  }

  for (const battle of recentGlobalBattles) {
    registerTrackInExposure(battle.trackA, context)
    registerTrackInExposure(battle.trackB, context)
  }

  return context
}

function hasPreview(track: Track): boolean {
  return typeof track.previewUrl === "string" && track.previewUrl.trim().length > 0
}

function trackBucket(track: Track): string {
  return track.catalogBucket ?? DEFAULT_BUCKET
}

function weightedRandomKey(entries: Array<{ key: string; weight: number }>): string {
  const positiveEntries = entries.filter((entry) => entry.weight > 0)
  if (positiveEntries.length === 0) {
    return entries[entries.length - 1]?.key ?? DEFAULT_BUCKET
  }

  const totalWeight = positiveEntries.reduce((sum, entry) => sum + entry.weight, 0)
  let cursor = Math.random() * totalWeight

  for (const entry of positiveEntries) {
    cursor -= entry.weight
    if (cursor <= 0) {
      return entry.key
    }
  }

  return positiveEntries[positiveEntries.length - 1].key
}

function passesArtistCooldown(track: Track, context: MatchmakingContext): boolean {
  if (context.userRecentArtistTokens.size === 0) {
    return true
  }

  return !extractArtistMatchTokens(track.artist).some((token) => context.userRecentArtistTokens.has(token))
}

function passesTitleCooldown(track: Track, context: MatchmakingContext): boolean {
  if (context.userRecentTitleKeys.size === 0) {
    return true
  }

  return !context.userRecentTitleKeys.has(buildTrackTitleKey(track))
}

function isTrackOverexposed(track: Track, context: MatchmakingContext): boolean {
  const titleExposure = context.globalTitleExposure.get(buildTrackTitleKey(track)) ?? 0
  if (titleExposure >= MAX_RECENT_TITLE_EXPOSURE) {
    return true
  }

  return countTrackArtistExposure(track, context.globalArtistExposure) >= MAX_RECENT_ARTIST_EXPOSURE
}

function applyUserCooldownFilter(tracks: Track[], context: MatchmakingContext): Track[] {
  const titleAndArtistFiltered = tracks.filter(
    (track) => passesTitleCooldown(track, context) && passesArtistCooldown(track, context)
  )

  if (titleAndArtistFiltered.length >= 2) {
    return titleAndArtistFiltered
  }

  const artistOnlyFiltered = tracks.filter((track) => passesArtistCooldown(track, context))
  if (artistOnlyFiltered.length >= 2) {
    return artistOnlyFiltered
  }

  return tracks
}

function applyExposureFilter(tracks: Track[], context: MatchmakingContext): Track[] {
  const filtered = tracks.filter((track) => !isTrackOverexposed(track, context))
  if (filtered.length >= 2) {
    return filtered
  }

  return tracks
}

function shareArtistTokens(trackA: Track, trackB: Track): boolean {
  const trackATokens = new Set(extractArtistMatchTokens(trackA.artist))
  for (const token of extractArtistMatchTokens(trackB.artist)) {
    if (trackATokens.has(token)) {
      return true
    }
  }

  return false
}

function shareTitleKey(trackA: Track, trackB: Track): boolean {
  return buildTrackTitleKey(trackA) === buildTrackTitleKey(trackB)
}

const THEMATIC_DUELS: ThematicDuelDefinition[] = [
  {
    key: "nostalgia_vs_actual",
    leftLabel: "nostalgia",
    rightLabel: "actual",
    pickLeft: (track) =>
      track.year <= 2008 ||
      trackBucket(track) === "classics_70s_80s_90s" ||
      trackBucket(track) === "classics_00s_10s",
    pickRight: (track) => track.year >= 2018 && ["pop", "urbano", "electronic", "indie_alt"].includes(trackBucket(track)),
  },
  {
    key: "fiesta_vs_chill",
    leftLabel: "fiesta",
    rightLabel: "chill",
    pickLeft: (track) =>
      (track.energy ?? 0.6) >= 0.68 || (track.danceability ?? 0.55) >= 0.7 || ["urbano", "cumbia_latina", "electronic"].includes(trackBucket(track)),
    pickRight: (track) =>
      (track.energy ?? 0.5) <= 0.48 && (track.valence ?? 0.5) <= 0.58,
  },
  {
    key: "rock_vs_urbano",
    leftLabel: "rock",
    rightLabel: "urbano",
    pickLeft: (track) => ["rock", "indie_alt"].includes(trackBucket(track)),
    pickRight: (track) => ["urbano", "pop", "cumbia_latina"].includes(trackBucket(track)),
  },
]

function selectThematicPair(previewTracks: Track[]): { trackA: Track; trackB: Track } | null {
  if (previewTracks.length < 2) {
    return null
  }

  const candidateThemes = THEMATIC_DUELS.filter((theme) => {
    const leftCount = previewTracks.filter(theme.pickLeft).length
    const rightCount = previewTracks.filter(theme.pickRight).length
    return leftCount > 0 && rightCount > 0
  })

  if (candidateThemes.length === 0) {
    return null
  }

  const selectedTheme = randomItem(candidateThemes)
  const leftPool = previewTracks.filter(selectedTheme.pickLeft)
  const rightPool = previewTracks.filter(selectedTheme.pickRight)

  if (leftPool.length === 0 || rightPool.length === 0) {
    return null
  }

  const trackA = weightedRandomTrack(leftPool)
  const filteredRight = rightPool.filter(
    (track) => track.id !== trackA.id && !shareArtistTokens(trackA, track) && !shareTitleKey(trackA, track)
  )
  const closeCandidates = filteredRight.filter(
    (track) => Math.abs(track.eloScore - trackA.eloScore) < MATCHMAKING_ELO_THRESHOLD
  )

  if (closeCandidates.length > 0) {
    return { trackA, trackB: randomItem(closeCandidates) }
  }

  if (filteredRight.length > 0) {
    return { trackA, trackB: weightedRandomTrack(filteredRight) }
  }

  const fallbackRight = rightPool.filter((track) => track.id !== trackA.id)
  if (fallbackRight.length > 0) {
    return { trackA, trackB: weightedRandomTrack(fallbackRight) }
  }

  return null
}

function selectPairWithinPool(pool: Track[]): { trackA: Track; trackB: Track } {
  const firstTrack = weightedRandomTrack(pool)
  const candidatePool = pool.filter((track) => track.id !== firstTrack.id)
  const preferredCandidates = candidatePool.filter(
    (track) => !shareArtistTokens(firstTrack, track) && !shareTitleKey(firstTrack, track)
  )

  const closeCandidates = preferredCandidates.filter(
    (track) =>
      Math.abs(track.eloScore - firstTrack.eloScore) < MATCHMAKING_ELO_THRESHOLD
  )

  if (closeCandidates.length > 0) {
    return { trackA: firstTrack, trackB: randomItem(closeCandidates) }
  }

  const fallbackCloseCandidates = candidatePool.filter(
    (track) => Math.abs(track.eloScore - firstTrack.eloScore) < MATCHMAKING_ELO_THRESHOLD
  )
  if (fallbackCloseCandidates.length > 0) {
    return { trackA: firstTrack, trackB: randomItem(fallbackCloseCandidates) }
  }

  const fallbackCandidates = preferredCandidates.length > 0 ? preferredCandidates : candidatePool
  return { trackA: firstTrack, trackB: weightedRandomTrack(fallbackCandidates) }
}

function selectWeightedBucket(
  buckets: Map<string, Track[]>,
  excludedBuckets: Set<string> = new Set()
): string | null {
  const entries: Array<{ key: string; weight: number }> = []

  for (const [bucket, bucketTracks] of buckets.entries()) {
    if (excludedBuckets.has(bucket) || bucketTracks.length === 0) {
      continue
    }

    const configuredWeight = BUCKET_MATCH_WEIGHTS[bucket] ?? BUCKET_MATCH_WEIGHTS[DEFAULT_BUCKET]
    const totalBattles = bucketTracks.reduce((sum, track) => sum + track.battlesCount, 0)
    const averageBattles = totalBattles / bucketTracks.length
    const exposurePenalty = 1 / (averageBattles + 1)
    const capacityBoost = Math.min(2, 1 + Math.log10(bucketTracks.length + 1))
    entries.push({
      key: bucket,
      weight: configuredWeight * exposurePenalty * capacityBoost,
    })
  }

  if (entries.length === 0) {
    return null
  }

  return weightedRandomKey(entries)
}

function selectCrossBucketPair(previewTracks: Track[]): { trackA: Track; trackB: Track } {
  const byBucket = new Map<string, Track[]>()

  for (const track of previewTracks) {
    const bucket = trackBucket(track)
    const current = byBucket.get(bucket) ?? []
    current.push(track)
    byBucket.set(bucket, current)
  }

  const firstBucket = selectWeightedBucket(byBucket)
  if (!firstBucket) {
    return selectPairWithinPool(previewTracks)
  }

  const secondBucket = selectWeightedBucket(byBucket, new Set([firstBucket]))
  if (!secondBucket) {
    return selectPairWithinPool(previewTracks)
  }

  const firstPool = byBucket.get(firstBucket) ?? []
  const secondPool = byBucket.get(secondBucket) ?? []
  if (firstPool.length === 0 || secondPool.length === 0) {
    return selectPairWithinPool(previewTracks)
  }

  const trackA = weightedRandomTrack(firstPool)
  const closeCandidates = secondPool.filter(
    (track) =>
      Math.abs(track.eloScore - trackA.eloScore) < MATCHMAKING_ELO_THRESHOLD &&
      !shareArtistTokens(trackA, track) &&
      !shareTitleKey(trackA, track)
  )

  if (closeCandidates.length > 0) {
    return { trackA, trackB: randomItem(closeCandidates) }
  }

  return { trackA, trackB: weightedRandomTrack(secondPool) }
}

function toTrack(track: {
  id: string
  spotifyTrackId: string | null
  catalogBucket: string
  name: string
  artist: string
  albumImage: string
  previewUrl: string | null
  previewSource: string | null
  previewCheckedAt: Date | null
  spotifyPopularity: number | null
  spotifyExplicit: boolean | null
  spotifyPreviewAvailable: boolean | null
  eloScore: number
  battlesCount: number
  bpm: number
  duration: string
  genre: string
  year: number
  energy: number | null
  valence: number | null
  danceability: number | null
}): Track {
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
  }
}

function toBattleState(status: PrismaBattleState): BattleState {
  return status
}

async function seedCatalogIfEmpty(): Promise<void> {
  assertDatabaseConfigured()

  const totalTracks = await prisma.track.count()
  if (totalTracks > 0) {
    return
  }

  await prisma.$transaction(
    MOCK_TRACKS.map((track) =>
      prisma.track.upsert({
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
      })
    )
  )
}

async function ensureUser(userId: string): Promise<void> {
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  })
}

async function sanitizeLegacyPlaceholderPreviews(): Promise<void> {
  const blockedPreviewWhere: Prisma.TrackWhereInput[] = BLOCKED_PREVIEW_URL_FRAGMENTS.map((fragment) => ({
    previewUrl: { contains: fragment },
  }))

  await prisma.track.updateMany({
    where: {
      OR: [{ previewUrl: LEGACY_PLACEHOLDER_PREVIEW_URL }, ...blockedPreviewWhere],
    },
    data: {
      previewUrl: null,
      previewSource: null,
      previewCheckedAt: new Date(),
      spotifyPreviewAvailable: false,
    },
  })
}

async function backfillMissingPreviewUrls(): Promise<void> {
  const recheckCutoff = new Date(Date.now() - PREVIEW_RECHECK_WINDOW_MS)
  const tracksMissingPreview = await prisma.track.findMany({
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
  })

  for (const track of tracksMissingPreview) {
    const checkedAt = new Date()
    const previewUrl = await fetchItunesPreviewUrl({
      trackName: track.name,
      artistName: track.artist,
    })

    await prisma.track.update({
      where: { id: track.id },
      data: {
        previewUrl: previewUrl ?? null,
        previewSource: previewUrl ? "itunes" : null,
        previewCheckedAt: checkedAt,
      },
    })
  }
}

function triggerPreviewBackfillInBackground(): void {
  if (previewBackfillPromise) {
    return
  }

  if (Date.now() - lastPreviewBackfillAt < PREVIEW_BACKFILL_MIN_INTERVAL_MS) {
    return
  }

  previewBackfillPromise = backfillMissingPreviewUrls()
    .catch(() => undefined)
    .finally(() => {
      lastPreviewBackfillAt = Date.now()
      previewBackfillPromise = null
    })
}

function selectBattlePair(
  tracks: Track[],
  artistDenylist: Set<string>,
  context: MatchmakingContext
): { trackA: Track; trackB: Track } {
  const curatedPreviewTracks = tracks.filter(
    (track) =>
      hasPreview(track) &&
      !isTrackBlockedByCurationHeuristics(track) &&
      !isArtistBlocked(track.artist, artistDenylist)
  )
  const basePreviewTracks =
    curatedPreviewTracks.length >= 2
      ? curatedPreviewTracks
      : tracks.filter((track) => hasPreview(track) && !isTrackBlockedByCurationHeuristics(track))
  const previewTracks = applyExposureFilter(applyUserCooldownFilter(basePreviewTracks, context), context)

  if (previewTracks.length >= 2) {
    if (Math.random() < THEMATIC_DUEL_PROBABILITY) {
      const thematicPair = selectThematicPair(previewTracks)
      if (thematicPair) {
        return thematicPair
      }
    }

    const byBucket = new Map<string, Track[]>()

    for (const track of previewTracks) {
      const bucket = trackBucket(track)
      const current = byBucket.get(bucket) ?? []
      current.push(track)
      byBucket.set(bucket, current)
    }

    const shouldUseIntraBucket = Math.random() < INTRA_BUCKET_RATIO
    const selectedBucket = selectWeightedBucket(byBucket)

    if (shouldUseIntraBucket && selectedBucket) {
      const bucketTracks = byBucket.get(selectedBucket) ?? []
      if (bucketTracks.length >= 2) {
        return selectPairWithinPool(bucketTracks)
      }
    }

    return selectCrossBucketPair(previewTracks)
  }

  throw new BattleCatalogError(
    "insufficient_preview_tracks",
    "Catalog does not have enough tracks with preview audio right now."
  )
}

export async function ensureBattleCatalog(): Promise<void> {
  assertDatabaseConfigured()
  await seedCatalogIfEmpty()
  await sanitizeLegacyPlaceholderPreviews()
  triggerPreviewBackfillInBackground()
  const artistDenylist = await getActiveArtistDenylist()
  const externalPreviewTrackCount = await prisma.track.count({
    where: {
      previewUrl: { not: null },
      previewSource: {
        in: ["spotify", "itunes"],
      },
    },
  })
  const hasHealthyExternalCatalog = externalPreviewTrackCount >= 8

  if (Date.now() - lastSpotifySyncAt < SPOTIFY_REFRESH_MS && hasHealthyExternalCatalog) {
    return
  }

  const spotifyTracks = (await fetchSpotifyBattleTracks(120)).filter(
    (track) => !isArtistBlocked(track.artist, artistDenylist)
  )

  if (spotifyTracks.length < 2) {
    const itunesTracks = (await fetchItunesBattleTracks(120)).filter(
      (track) => !isArtistBlocked(track.artist, artistDenylist)
    )

    if (itunesTracks.length >= 2) {
      await prisma.$transaction(
        itunesTracks.map((track) =>
          prisma.track.upsert({
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
              previewUrl: track.previewUrl,
              previewSource: track.previewSource ?? (track.previewUrl ? "itunes" : null),
              previewCheckedAt: new Date(),
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
          })
        )
      )

      lastSpotifySyncAt = Date.now()
    }

    triggerPreviewBackfillInBackground()
    return
  }

  await prisma.$transaction(
    spotifyTracks.map((track) =>
      prisma.track.upsert({
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
          previewUrl: track.previewUrl,
          previewSource: track.previewUrl ? "spotify" : null,
          previewCheckedAt: new Date(),
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
      })
    )
  )
  lastSpotifySyncAt = Date.now()
  triggerPreviewBackfillInBackground()
}

export async function createPendingBattle(userId: string): Promise<Battle> {
  assertDatabaseConfigured()
  await seedCatalogIfEmpty()
  await ensureUser(userId)
  const artistDenylist = await getActiveArtistDenylist(true)
  const matchmakingContext = await buildMatchmakingContext(userId)

  const trackRows = await prisma.track.findMany()
  if (trackRows.length < 2) {
    throw new Error("At least two tracks are required to create a battle")
  }

  const tracks = trackRows.map(toTrack)
  const { trackA, trackB } = selectBattlePair(tracks, artistDenylist, matchmakingContext)
  const battle = await prisma.battle.create({
    data: {
      userId,
      trackAId: trackA.id,
      trackBId: trackB.id,
      status: "PENDING",
    },
  })

  return {
    id: battle.id,
    trackA,
    trackB,
    userId: battle.userId,
    status: toBattleState(battle.status),
    winnerId: null,
    createdAt: battle.createdAt.toISOString(),
    completedAt: null,
  }
}

export async function completeBattleVote(payload: BattleVotePayload): Promise<BattleVoteResult> {
  assertDatabaseConfigured()
  const { battleId, userId, winnerId, loserId } = payload
  if (winnerId === loserId) {
    throw new VoteError("vote_same_track", "winnerId and loserId must be different")
  }

  return prisma.$transaction(async (tx) => {
    const battle = await tx.battle.findUnique({
      where: { id: battleId },
      include: {
        trackA: true,
        trackB: true,
      },
    })

    if (!battle) {
      throw new VoteError("battle_not_found", "Battle not found")
    }

    if (battle.status !== "PENDING") {
      throw new VoteError("battle_already_completed", "Battle already completed")
    }

    if (battle.userId !== userId) {
      throw new VoteError("battle_forbidden_user", "Battle does not belong to user")
    }

    const validIds = [battle.trackAId, battle.trackBId]
    if (!validIds.includes(winnerId) || !validIds.includes(loserId)) {
      throw new VoteError("vote_does_not_match_battle", "Vote does not match battle tracks")
    }

    const winner =
      battle.trackAId === winnerId
        ? battle.trackA
        : battle.trackBId === winnerId
          ? battle.trackB
          : null
    const loser =
      battle.trackAId === loserId
        ? battle.trackA
        : battle.trackBId === loserId
          ? battle.trackB
          : null

    if (!winner || !loser) {
      throw new VoteError("track_not_found", "Track not found")
    }

    const { newWinnerElo, newLoserElo } = calculateElo(winner.eloScore, loser.eloScore)
    const winnerEloChange = newWinnerElo - winner.eloScore
    const loserEloChange = newLoserElo - loser.eloScore
    const completedAt = new Date()

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
    })

    if (lockedBattle.count !== 1) {
      throw new VoteError("battle_already_completed", "Battle already completed")
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
    ])

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
    }
  })
}

export async function getBattleHistory(params: {
  userId?: string
  trackId?: string
  limit?: number
}): Promise<BattleHistoryEntry[]> {
  assertDatabaseConfigured()
  const limit = Math.max(1, params.limit ?? 20)
  const where: Prisma.BattleWhereInput = {
    status: "COMPLETED",
  }

  if (params.userId) {
    where.userId = params.userId
  }

  if (params.trackId) {
    where.OR = [{ trackAId: params.trackId }, { trackBId: params.trackId }]
  }

  const battles = await prisma.battle.findMany({
    where,
    include: {
      trackA: true,
      trackB: true,
    },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  })

  return battles.flatMap((battle) => {
    if (!battle.winnerId || !battle.loserId || !battle.completedAt) {
      return []
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
    ]
  })
}

export async function getUserBattleStats(userId: string): Promise<{
  completedBattlesCount: number
}> {
  assertDatabaseConfigured()
  const completedBattlesCount = await prisma.battle.count({
    where: {
      userId,
      status: "COMPLETED",
    },
  })

  return { completedBattlesCount }
}

export async function getLeaderboardTracks(): Promise<Track[]> {
  assertDatabaseConfigured()
  const tracks = await prisma.track.findMany({
    orderBy: [{ eloScore: "desc" }, { battlesCount: "asc" }],
  })

  return tracks.map(toTrack)
}
