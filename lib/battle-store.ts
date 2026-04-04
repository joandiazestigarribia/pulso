import { Prisma, type BattleState as PrismaBattleState } from "@prisma/client"
import { z } from "zod"
import { assertDatabaseConfigured, prisma } from "@/lib/db"
import { calculateElo } from "@/lib/elo"
import { MOCK_TRACKS, type Battle, type BattleState, type Track } from "@/lib/mock-data"
import {
  fetchDeezerBattleTracks,
  fetchDeezerPreviewUrlByTrackId,
  fetchItunesBattleTracks,
  fetchItunesPreviewUrl,
} from "@/lib/catalog-providers"
import {
  buildTrackTitleKey,
  extractArtistMatchTokens,
  isTrackAllowedByManualCuration,
  normalizeCatalogText,
} from "@/lib/catalog-curation"
import { getActiveArtistDenylist, isArtistBlocked } from "@/lib/catalog-policy"

const MATCHMAKING_ELO_THRESHOLD = 200
const CATALOG_REFRESH_MS = 1000 * 60 * 30
const CATALOG_SYNC_LIMIT = 200
const EXTERNAL_PREVIEW_TRACK_THRESHOLD = 8
const LEGACY_PLACEHOLDER_PREVIEW_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3"
const BLOCKED_PREVIEW_URL_FRAGMENTS = ["cdn.example.com", "tests.invalid", ".invalid/"]
const PREVIEW_BACKFILL_BATCH_SIZE = 50
const PREVIEW_BACKFILL_MIN_INTERVAL_MS = 1000 * 30
const PREVIEW_RECHECK_WINDOW_MS = 1000 * 60 * 60 * 24 * 7
const DEEZER_PREVIEW_EXPIRY_SAFETY_SECONDS = 90
const DEFAULT_BUCKET = "general"
const ENABLE_STRICT_EXTERNAL_CATALOG_SYNC = true
const INTRA_BUCKET_RATIO = 0.6
const THEMATIC_DUEL_PROBABILITY = 0.3
const STYLE_FOCUS_WINDOW_SIZE = 3
const STYLE_FOCUS_CYCLE_SIZE = 10
const STYLE_FOCUS_INTRA_RATIO = 0.82
const STYLE_FOCUS_THEMATIC_DUEL_PROBABILITY = 0.08
const USER_COOLDOWN_RECENT_BATTLES = 6
const GLOBAL_EXPOSURE_RECENT_BATTLES = 250
const MAX_RECENT_TITLE_EXPOSURE = 8
const MAX_RECENT_ARTIST_EXPOSURE = 16
const MAX_TRACKS_PER_ARTIST_IN_POOL = 3
const BUCKET_MATCH_WEIGHTS: Record<string, number> = {
  classics_70s_80s_90s: 12,
  classics_00s_10s: 12,
  rock: 11,
  metal_hardrock: 9,
  pop: 11,
  cumbia_latina: 10,
  folk_regional: 8,
  urbano: 10,
  hiphop_rap: 9,
  rnb_soul: 9,
  electronic: 10,
  indie_alt: 10,
  [DEFAULT_BUCKET]: 6,
}

const BUCKET_TARGET_SHARE: Record<string, number> = {
  classics_70s_80s_90s: 0.1,
  classics_00s_10s: 0.1,
  rock: 0.1,
  metal_hardrock: 0.08,
  pop: 0.1,
  cumbia_latina: 0.09,
  folk_regional: 0.08,
  urbano: 0.1,
  hiphop_rap: 0.08,
  rnb_soul: 0.08,
  electronic: 0.09,
  indie_alt: 0.1,
  [DEFAULT_BUCKET]: 0,
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

export interface CatalogBucketDiagnostics {
  bucket: string
  totalTracks: number
  previewTracks: number
  averageBattlesCount: number
}

export interface CatalogSourceDiagnostics {
  source: string
  totalTracks: number
}

export interface CatalogTrackExposureDiagnostics {
  trackId: string
  name: string
  artist: string
  bucket: string
  previewSource: string | null
  battlesCount: number
  eloScore: number
  recentBattleAppearances: number
}

export interface CatalogDiagnosticsReport {
  generatedAt: string
  totals: {
    tracks: number
    previewTracks: number
    previewCoverage: number
  }
  buckets: CatalogBucketDiagnostics[]
  sources: CatalogSourceDiagnostics[]
  topArtistsByCatalogSize: Array<{ artist: string; tracks: number }>
  topTracksByExposure: CatalogTrackExposureDiagnostics[]
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

let lastCatalogSyncAt = 0
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

interface MatchmakingStyleFocus {
  key: "rock_lane" | "urban_lane" | "electro_lane"
  buckets: string[]
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

async function countExternalPreviewTracks(): Promise<number> {
  const tracks = await prisma.track.findMany({
    where: {
      previewUrl: { not: null },
      previewSource: {
        in: ["deezer", "itunes"],
      },
    },
    select: {
      previewUrl: true,
      previewSource: true,
    },
  })

  return tracks.filter((track) =>
    hasTrackPreview({
      previewUrl: track.previewUrl,
      previewSource: track.previewSource,
    })
  ).length
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

function extractDeezerPreviewExpiryUnix(previewUrl: string): number | null {
  try {
    const url = new URL(previewUrl)
    const hdnea = url.searchParams.get("hdnea")
    if (!hdnea) {
      return null
    }

    const segments = hdnea.split("~")
    const expSegment = segments.find((segment) => segment.startsWith("exp="))
    if (!expSegment) {
      return null
    }

    const exp = Number.parseInt(expSegment.slice(4), 10)
    return Number.isFinite(exp) ? exp : null
  } catch {
    return null
  }
}

function isExpiredDeezerPreview(previewUrl: string): boolean {
  const expiryUnix = extractDeezerPreviewExpiryUnix(previewUrl)
  if (!expiryUnix) {
    return false
  }

  const nowUnix = Math.floor(Date.now() / 1000)
  return nowUnix >= expiryUnix - DEEZER_PREVIEW_EXPIRY_SAFETY_SECONDS
}

function hasPlayablePreview(track: Pick<Track, "previewUrl" | "previewSource">): boolean {
  if (typeof track.previewUrl !== "string" || track.previewUrl.trim().length === 0) {
    return false
  }

  if (track.previewSource === "deezer" && isExpiredDeezerPreview(track.previewUrl)) {
    return false
  }

  return true
}

function hasPreview(track: Track): boolean {
  return hasPlayablePreview(track)
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

function capArtistPresence(tracks: Track[], maxTracksPerArtist: number): Track[] {
  if (tracks.length <= 2) {
    return tracks
  }

  const countsByToken = new Map<string, number>()
  const accepted: Track[] = []
  const overflow: Track[] = []

  for (const track of tracks) {
    const tokens = extractArtistMatchTokens(track.artist)
    const primaryToken = tokens[0]
    if (!primaryToken) {
      accepted.push(track)
      continue
    }

    const currentCount = countsByToken.get(primaryToken) ?? 0
    if (currentCount < maxTracksPerArtist) {
      countsByToken.set(primaryToken, currentCount + 1)
      accepted.push(track)
      continue
    }

    overflow.push(track)
  }

  if (accepted.length < 2) {
    return tracks
  }

  return [...accepted, ...overflow]
}

function computeBucketShareByBattles(previewTracks: Track[]): Map<string, number> {
  const totalBattles = previewTracks.reduce((sum, track) => sum + track.battlesCount, 0)
  const byBucket = new Map<string, number>()

  for (const track of previewTracks) {
    const bucket = trackBucket(track)
    byBucket.set(bucket, (byBucket.get(bucket) ?? 0) + track.battlesCount)
  }

  if (totalBattles <= 0) {
    return new Map()
  }

  const shareByBucket = new Map<string, number>()
  for (const [bucket, battles] of byBucket.entries()) {
    shareByBucket.set(bucket, battles / totalBattles)
  }

  return shareByBucket
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
    pickRight: (track) =>
      track.year >= 2018 &&
      ["pop", "urbano", "hiphop_rap", "rnb_soul", "electronic", "indie_alt"].includes(trackBucket(track)),
  },
  {
    key: "fiesta_vs_chill",
    leftLabel: "fiesta",
    rightLabel: "chill",
    pickLeft: (track) =>
      (track.energy ?? 0.6) >= 0.68 ||
      (track.danceability ?? 0.55) >= 0.7 ||
      ["urbano", "hiphop_rap", "cumbia_latina", "electronic"].includes(trackBucket(track)),
    pickRight: (track) =>
      (track.energy ?? 0.5) <= 0.48 && (track.valence ?? 0.5) <= 0.58,
  },
  {
    key: "rock_vs_urbano",
    leftLabel: "rock",
    rightLabel: "urbano",
    pickLeft: (track) => ["rock", "metal_hardrock", "indie_alt"].includes(trackBucket(track)),
    pickRight: (track) => ["urbano", "hiphop_rap", "pop", "cumbia_latina"].includes(trackBucket(track)),
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

function resolveMatchmakingStyleFocus(createdBattlesCount: number): MatchmakingStyleFocus | null {
  if (createdBattlesCount < STYLE_FOCUS_CYCLE_SIZE) {
    return null
  }

  const cyclePosition = createdBattlesCount % STYLE_FOCUS_CYCLE_SIZE
  if (cyclePosition >= STYLE_FOCUS_WINDOW_SIZE) {
    return null
  }

  const blockIndex = Math.floor(createdBattlesCount / STYLE_FOCUS_CYCLE_SIZE) % 3
  if (blockIndex === 0) {
    return {
      key: "rock_lane",
      buckets: ["rock", "metal_hardrock", "indie_alt", "classics_70s_80s_90s"],
    }
  }

  if (blockIndex === 1) {
    return {
      key: "urban_lane",
      buckets: ["urbano", "hiphop_rap", "rnb_soul", "cumbia_latina", "pop"],
    }
  }

  return {
    key: "electro_lane",
    buckets: ["electronic", "pop", "indie_alt", "classics_00s_10s"],
  }
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
  excludedBuckets: Set<string> = new Set(),
  currentShareByBucket: Map<string, number> = new Map()
): string | null {
  const entries: Array<{ key: string; weight: number }> = []

  for (const [bucket, bucketTracks] of buckets.entries()) {
    if (excludedBuckets.has(bucket) || bucketTracks.length === 0) {
      continue
    }

    const configuredWeight = BUCKET_MATCH_WEIGHTS[bucket] ?? BUCKET_MATCH_WEIGHTS[DEFAULT_BUCKET]
    const targetShare = BUCKET_TARGET_SHARE[bucket] ?? BUCKET_TARGET_SHARE[DEFAULT_BUCKET]
    const currentShare = currentShareByBucket.get(bucket) ?? 0
    const targetBoost = targetShare > 0 ? Math.max(0.2, 1 + (targetShare - currentShare) * 3) : 1
    const totalBattles = bucketTracks.reduce((sum, track) => sum + track.battlesCount, 0)
    const averageBattles = totalBattles / bucketTracks.length
    const exposurePenalty = 1 / (averageBattles + 1)
    const capacityBoost = Math.min(2, 1 + Math.log10(bucketTracks.length + 1))
    entries.push({
      key: bucket,
      weight: configuredWeight * exposurePenalty * capacityBoost * targetBoost,
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

  const currentShareByBucket = computeBucketShareByBattles(previewTracks)
  const firstBucket = selectWeightedBucket(byBucket, new Set(), currentShareByBucket)
  if (!firstBucket) {
    return selectPairWithinPool(previewTracks)
  }

  const secondBucket = selectWeightedBucket(byBucket, new Set([firstBucket]), currentShareByBucket)
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
  catalogBucket: string
  name: string
  artist: string
  albumImage: string
  previewUrl: string | null
  previewSource: string | null
  previewCheckedAt: Date | null
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
    catalogBucket: track.catalogBucket,
    name: track.name,
    artist: track.artist,
    albumImage: track.albumImage,
    previewUrl: track.previewUrl,
    previewSource: track.previewSource,
    previewCheckedAt: track.previewCheckedAt?.toISOString() ?? null,
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
    },
  })
}

async function clearExpiredDeezerPreviewUrls(): Promise<void> {
  const deezerTracks = await prisma.track.findMany({
    where: {
      previewSource: "deezer",
      previewUrl: { not: null },
    },
    select: {
      id: true,
      previewUrl: true,
    },
  })

  const expiredTrackIds = deezerTracks
    .filter((track) => track.previewUrl && isExpiredDeezerPreview(track.previewUrl))
    .map((track) => track.id)

  if (expiredTrackIds.length === 0) {
    return
  }

  await prisma.track.updateMany({
    where: {
      id: {
        in: expiredTrackIds,
      },
    },
    data: {
      previewUrl: null,
      previewSource: null,
      previewCheckedAt: new Date(),
    },
  })
}

async function normalizeLegacyPreviewSources(): Promise<void> {
  await prisma.track.updateMany({
    where: {
      previewSource: {
        notIn: ["deezer", "itunes"],
      },
    },
    data: {
      previewSource: "itunes",
      previewCheckedAt: new Date(),
    },
  })

  await prisma.track.updateMany({
    where: {
      previewUrl: { not: null },
      previewSource: null,
      id: { startsWith: "deezer_" },
    },
    data: {
      previewSource: "deezer",
      previewCheckedAt: new Date(),
    },
  })

  await prisma.track.updateMany({
    where: {
      previewUrl: { not: null },
      previewSource: null,
      id: { not: { startsWith: "deezer_" } },
    },
    data: {
      previewSource: "itunes",
      previewCheckedAt: new Date(),
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

async function suppressStaleExternalTracks(activeTrackIds: string[]): Promise<void> {
  if (
    !ENABLE_STRICT_EXTERNAL_CATALOG_SYNC ||
    activeTrackIds.length < EXTERNAL_PREVIEW_TRACK_THRESHOLD
  ) {
    return
  }

  await prisma.track.updateMany({
    where: {
      previewSource: {
        in: ["deezer", "itunes"],
      },
      id: {
        notIn: activeTrackIds,
      },
    },
    data: {
      previewUrl: null,
      previewSource: null,
      previewCheckedAt: new Date(),
    },
  })
}

function hasTrackPreview(track: Pick<Track, "previewUrl" | "previewSource">): boolean {
  return hasPlayablePreview(track)
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
  context: MatchmakingContext,
  options?: {
    applyCooldownFilters?: boolean
    styleFocusBuckets?: string[]
  }
): { trackA: Track; trackB: Track } {
  const applyCooldownFilters = options?.applyCooldownFilters ?? true
  const styleFocusBuckets = options?.styleFocusBuckets ?? []
  const allPreviewTracks = tracks.filter((track) => hasPreview(track))
  const curatedPreviewTracks = allPreviewTracks.filter(
    (track) =>
      isTrackAllowedByManualCuration(track) &&
      !isArtistBlocked(track.artist, artistDenylist)
  )
  const basePreviewTracks = curatedPreviewTracks.length >= 2 ? curatedPreviewTracks : allPreviewTracks
  const rawPreviewTracks = applyCooldownFilters
    ? applyExposureFilter(applyUserCooldownFilter(basePreviewTracks, context), context)
    : basePreviewTracks
  const previewTracks = capArtistPresence(rawPreviewTracks, MAX_TRACKS_PER_ARTIST_IN_POOL)
  const styleFocusSet = new Set(styleFocusBuckets)
  const focusedPreviewTracks =
    styleFocusSet.size > 0
      ? previewTracks.filter((track) => styleFocusSet.has(trackBucket(track)))
      : []
  const activePreviewTracks = focusedPreviewTracks.length >= 2 ? focusedPreviewTracks : previewTracks
  const intraBucketRatio = focusedPreviewTracks.length >= 2 ? STYLE_FOCUS_INTRA_RATIO : INTRA_BUCKET_RATIO
  const thematicProbability =
    focusedPreviewTracks.length >= 2 ? STYLE_FOCUS_THEMATIC_DUEL_PROBABILITY : THEMATIC_DUEL_PROBABILITY

  if (activePreviewTracks.length >= 2) {
    if (Math.random() < thematicProbability) {
      const thematicPair = selectThematicPair(activePreviewTracks)
      if (thematicPair) {
        return thematicPair
      }
    }

    const byBucket = new Map<string, Track[]>()

    for (const track of activePreviewTracks) {
      const bucket = trackBucket(track)
      const current = byBucket.get(bucket) ?? []
      current.push(track)
      byBucket.set(bucket, current)
    }

    const shouldUseIntraBucket = Math.random() < intraBucketRatio
    const currentShareByBucket = computeBucketShareByBattles(activePreviewTracks)
    const selectedBucket = selectWeightedBucket(byBucket, new Set(), currentShareByBucket)

    if (shouldUseIntraBucket && selectedBucket) {
      const bucketTracks = byBucket.get(selectedBucket) ?? []
      if (bucketTracks.length >= 2) {
        return selectPairWithinPool(bucketTracks)
      }
    }

    return selectCrossBucketPair(activePreviewTracks)
  }

  throw new BattleCatalogError(
    "insufficient_preview_tracks",
    "Catalog does not have enough tracks with preview audio right now."
  )
}

export async function ensureBattleCatalog(options?: { forceRefresh?: boolean }): Promise<void> {
  assertDatabaseConfigured()
  await seedCatalogIfEmpty()
  await sanitizeLegacyPlaceholderPreviews()
  await clearExpiredDeezerPreviewUrls()
  await normalizeLegacyPreviewSources()
  triggerPreviewBackfillInBackground()
  const forceRefresh = options?.forceRefresh ?? false
  const artistDenylist = await getActiveArtistDenylist()
  const externalPreviewTrackCount = await countExternalPreviewTracks()
  const hasHealthyExternalCatalog = externalPreviewTrackCount >= EXTERNAL_PREVIEW_TRACK_THRESHOLD

  if (!forceRefresh && Date.now() - lastCatalogSyncAt < CATALOG_REFRESH_MS && hasHealthyExternalCatalog) {
    return
  }

  const deezerTracks = (await fetchDeezerBattleTracks(CATALOG_SYNC_LIMIT)).filter(
    (track) => !isArtistBlocked(track.artist, artistDenylist)
  )
  const deezerPreviewTracks = deezerTracks.filter((track) => hasTrackPreview(track))

  if (deezerPreviewTracks.length < 2) {
    const itunesTracks = (await fetchItunesBattleTracks(CATALOG_SYNC_LIMIT)).filter(
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
              ...(hasTrackPreview(track)
                ? {
                    previewUrl: track.previewUrl,
                    previewSource: track.previewSource ?? "itunes",
                    previewCheckedAt: new Date(),
                  }
                : {}),
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

      await suppressStaleExternalTracks(itunesTracks.filter((track) => hasTrackPreview(track)).map((track) => track.id))

      lastCatalogSyncAt = Date.now()
    }

    triggerPreviewBackfillInBackground()
    return
  }

  await prisma.$transaction(
    deezerTracks.map((track) =>
      prisma.track.upsert({
        where: { id: track.id },
        create: {
          ...track,
          catalogBucket: track.catalogBucket ?? DEFAULT_BUCKET,
          previewSource: track.previewUrl ? "deezer" : null,
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
                previewSource: "deezer",
                previewCheckedAt: new Date(),
              }
            : {}),
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
  await suppressStaleExternalTracks(deezerPreviewTracks.map((track) => track.id))
  lastCatalogSyncAt = Date.now()
  triggerPreviewBackfillInBackground()
}

export async function createPendingBattle(userId: string): Promise<Battle> {
  assertDatabaseConfigured()
  await seedCatalogIfEmpty()
  await ensureUser(userId)
  const artistDenylist = await getActiveArtistDenylist(true)
  const externalPreviewTrackCount = await countExternalPreviewTracks()
  const hasHealthyExternalCatalog = externalPreviewTrackCount >= EXTERNAL_PREVIEW_TRACK_THRESHOLD
  const matchmakingContext = hasHealthyExternalCatalog
    ? await buildMatchmakingContext(userId)
    : buildDefaultMatchmakingContext()

  const [trackRows, createdBattlesCount] = await Promise.all([
    prisma.track.findMany(),
    prisma.battle.count({ where: { userId } }),
  ])
  const styleFocus = resolveMatchmakingStyleFocus(createdBattlesCount)
  if (trackRows.length < 2) {
    throw new Error("At least two tracks are required to create a battle")
  }

  const tracks = trackRows.map(toTrack)
  const { trackA, trackB } = selectBattlePair(tracks, artistDenylist, matchmakingContext, {
    applyCooldownFilters: hasHealthyExternalCatalog,
    styleFocusBuckets: styleFocus?.buckets,
  })
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

export async function getCatalogDiagnostics(): Promise<CatalogDiagnosticsReport> {
  assertDatabaseConfigured()

  const [tracks, recentBattles] = await Promise.all([
    prisma.track.findMany({
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
    prisma.battle.findMany({
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
  ])

  const bucketAggregate = new Map<string, { total: number; preview: number; battles: number }>()
  const sourceAggregate = new Map<string, number>()
  const artistAggregate = new Map<string, number>()
  const recentExposureByTrackId = new Map<string, number>()

  for (const battle of recentBattles) {
    recentExposureByTrackId.set(battle.trackA.id, (recentExposureByTrackId.get(battle.trackA.id) ?? 0) + 1)
    recentExposureByTrackId.set(battle.trackB.id, (recentExposureByTrackId.get(battle.trackB.id) ?? 0) + 1)
  }

  for (const track of tracks) {
    const bucket = track.catalogBucket ?? DEFAULT_BUCKET
    const bucketStats = bucketAggregate.get(bucket) ?? { total: 0, preview: 0, battles: 0 }
    bucketStats.total += 1
    bucketStats.battles += track.battlesCount
    if (typeof track.previewUrl === "string" && track.previewUrl.trim().length > 0) {
      bucketStats.preview += 1
    }
    bucketAggregate.set(bucket, bucketStats)

    const normalizedArtist = normalizeCatalogText(track.artist)
    if (normalizedArtist.length > 0) {
      artistAggregate.set(normalizedArtist, (artistAggregate.get(normalizedArtist) ?? 0) + 1)
    }

    const source = track.previewSource ?? "none"
    sourceAggregate.set(source, (sourceAggregate.get(source) ?? 0) + 1)
  }

  const previewTracks = tracks.filter((track) => Boolean(track.previewUrl)).length
  const buckets = Array.from(bucketAggregate.entries())
    .map(([bucket, stats]) => ({
      bucket,
      totalTracks: stats.total,
      previewTracks: stats.preview,
      averageBattlesCount: stats.total > 0 ? Number((stats.battles / stats.total).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.totalTracks - a.totalTracks)

  const sources = Array.from(sourceAggregate.entries())
    .map(([source, totalTracks]) => ({ source, totalTracks }))
    .sort((a, b) => b.totalTracks - a.totalTracks)

  const topArtistsByCatalogSize = Array.from(artistAggregate.entries())
    .map(([artist, count]) => ({ artist, tracks: count }))
    .sort((a, b) => b.tracks - a.tracks)
    .slice(0, 20)

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
        return b.recentBattleAppearances - a.recentBattleAppearances
      }
      return b.battlesCount - a.battlesCount
    })
    .slice(0, 30)

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

export async function resetUserBattleProgress(userId: string): Promise<{ deletedBattles: number }> {
  assertDatabaseConfigured()

  return prisma.$transaction(async (tx) => {
    await tx.musicProfile.deleteMany({
      where: { userId },
    })

    const deletedBattles = await tx.battle.deleteMany({
      where: { userId },
    })

    return {
      deletedBattles: deletedBattles.count,
    }
  })
}

export async function getLeaderboardTracks(): Promise<Track[]> {
  assertDatabaseConfigured()
  const tracks = await prisma.track.findMany({
    orderBy: [{ eloScore: "desc" }, { battlesCount: "asc" }],
  })

  return tracks.map(toTrack)
}

export async function refreshTrackPreview(trackId: string): Promise<{
  trackId: string
  previewUrl: string | null
  previewSource: string | null
}> {
  assertDatabaseConfigured()

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: {
      id: true,
      name: true,
      artist: true,
      previewSource: true,
    },
  })

  if (!track) {
    throw new Error("Track not found")
  }

  let refreshedPreviewUrl: string | null = null
  let refreshedPreviewSource: string | null = null

  if (track.id.startsWith("deezer_")) {
    const deezerId = track.id.slice("deezer_".length)
    refreshedPreviewUrl = await fetchDeezerPreviewUrlByTrackId(deezerId)
    refreshedPreviewSource = refreshedPreviewUrl ? "deezer" : null
  }

  if (!refreshedPreviewUrl) {
    refreshedPreviewUrl = await fetchItunesPreviewUrl({
      trackName: track.name,
      artistName: track.artist,
    })
    refreshedPreviewSource = refreshedPreviewUrl ? "itunes" : null
  }

  await prisma.track.update({
    where: { id: track.id },
    data: {
      previewUrl: refreshedPreviewUrl,
      previewSource: refreshedPreviewSource,
      previewCheckedAt: new Date(),
    },
  })

  return {
    trackId: track.id,
    previewUrl: refreshedPreviewUrl,
    previewSource: refreshedPreviewSource,
  }
}
