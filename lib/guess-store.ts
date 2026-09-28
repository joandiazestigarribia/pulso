import { Prisma, type Track as PrismaTrack } from "@prisma/client"
import { assertDatabaseConfigured, prisma } from "@/lib/db"
import { GUESS_MAX_PLAYLIST_TRACKS, GUESS_ROUND_COUNT } from "@/lib/guess-config"
import type { Track } from "@/lib/mock-data"
import { hasPlayablePreview, toTrack } from "@/lib/battle-store"
import { fetchDeezerTrackById, shuffleTracks } from "@/lib/catalog-providers"

const DECOY_CANDIDATE_POOL_SIZE = 40
const DECOY_TOP_CANDIDATES = 8

export type PlaylistStatusValue = "DRAFT" | "PUBLISHED"

export interface PlaylistSummary {
  id: string
  title: string
  status: PlaylistStatusValue
  roundCount: number
  trackCount: number
  eligibleTrackCount: number
  publishedAt: string | null
  createdAt: string
}

export interface PlaylistTrackSummary {
  id: string
  position: number
  track: Track
}

export interface PlaylistDetail extends PlaylistSummary {
  tracks: PlaylistTrackSummary[]
}

export interface PublicPlaylistInfo {
  token: string
  title: string
  ownerUserId: string
  roundCount: number
  publishedAt: string
}

export interface GuessRoundPayload {
  roundIndex: number
  totalRounds: number
  cardA: Track
  cardB: Track
}

export interface GuessAttemptSummary {
  attemptId: string
  nickname: string
  score: number
  totalRounds: number
  percentage: number
  completedAt: string
}

export type GuessRoundState =
  | { status: "in_progress"; round: GuessRoundPayload }
  | { status: "completed"; summary: GuessAttemptSummary }

export interface GuessAnswerResult {
  correct: boolean
  correctTrackId: string
  isFinished: boolean
  score: number
  totalRounds: number
  percentage: number
}

export interface LeaderboardEntry {
  attemptId: string
  nickname: string
  score: number
  totalRounds: number
  percentage: number
  completedAt: string
}

export type PlaylistErrorCode =
  | "playlist_not_found"
  | "playlist_forbidden"
  | "playlist_not_draft"
  | "playlist_not_published"
  | "insufficient_tracks"
  | "owner_cannot_play"
  | "attempt_not_found"
  | "round_out_of_sequence"
  | "invalid_choice"
  | "track_not_found"
  | "playlist_track_limit_reached"

export class PlaylistError extends Error {
  readonly code: PlaylistErrorCode
  readonly meta?: Record<string, unknown>

  constructor(code: PlaylistErrorCode, message: string, meta?: Record<string, unknown>) {
    super(message)
    this.code = code
    this.meta = meta
  }
}

const PLAYLIST_ERROR_STATUS: Record<PlaylistErrorCode, number> = {
  playlist_not_found: 404,
  playlist_forbidden: 403,
  playlist_not_draft: 409,
  playlist_not_published: 409,
  insufficient_tracks: 422,
  owner_cannot_play: 403,
  attempt_not_found: 404,
  round_out_of_sequence: 409,
  invalid_choice: 400,
  track_not_found: 404,
  playlist_track_limit_reached: 422,
}

export function playlistErrorStatus(code: PlaylistErrorCode): number {
  return PLAYLIST_ERROR_STATUS[code]
}

async function ensureUser(userId: string): Promise<void> {
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  })
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function toPercentage(score: number, totalRounds: number): number {
  if (totalRounds <= 0) {
    return 0
  }

  return Math.round((score / totalRounds) * 100)
}

function toPlaylistSummary(
  playlist: {
    id: string
    title: string
    status: PlaylistStatusValue
    roundCount: number
    publishedAt: Date | null
    createdAt: Date
  },
  trackCount: number,
  eligibleTrackCount: number
): PlaylistSummary {
  return {
    id: playlist.id,
    title: playlist.title,
    status: playlist.status,
    roundCount: playlist.roundCount,
    trackCount,
    eligibleTrackCount,
    publishedAt: playlist.publishedAt?.toISOString() ?? null,
    createdAt: playlist.createdAt.toISOString(),
  }
}

function toAttemptSummary(attempt: {
  id: string
  nickname: string
  score: number
  totalRounds: number
  completedAt: Date | null
}): GuessAttemptSummary {
  return {
    attemptId: attempt.id,
    nickname: attempt.nickname,
    score: attempt.score,
    totalRounds: attempt.totalRounds,
    percentage: toPercentage(attempt.score, attempt.totalRounds),
    completedAt: (attempt.completedAt ?? new Date()).toISOString(),
  }
}

export async function createDraftPlaylist(ownerUserId: string, title: string): Promise<PlaylistSummary> {
  assertDatabaseConfigured()
  await ensureUser(ownerUserId)

  const trimmedTitle = title.trim().slice(0, 80) || "Mi lista"
  const playlist = await prisma.playlist.create({
    data: {
      ownerUserId,
      title: trimmedTitle,
      roundCount: GUESS_ROUND_COUNT,
    },
  })

  return toPlaylistSummary(playlist, 0, 0)
}

export async function listOwnedPlaylists(ownerUserId: string): Promise<PlaylistSummary[]> {
  assertDatabaseConfigured()
  const playlists = await prisma.playlist.findMany({
    where: { ownerUserId },
    include: {
      tracks: { include: { track: { select: { previewUrl: true, previewSource: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  return playlists.map((playlist) => {
    const eligibleTrackCount = playlist.tracks.filter((playlistTrack) =>
      hasPlayablePreview(playlistTrack.track)
    ).length

    return toPlaylistSummary(playlist, playlist.tracks.length, eligibleTrackCount)
  })
}

export async function getOwnedPlaylistDetail(playlistId: string, ownerUserId: string): Promise<PlaylistDetail> {
  assertDatabaseConfigured()
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: {
      tracks: { include: { track: true }, orderBy: { position: "asc" } },
    },
  })

  if (!playlist) {
    throw new PlaylistError("playlist_not_found", "Playlist not found")
  }
  if (playlist.ownerUserId !== ownerUserId) {
    throw new PlaylistError("playlist_forbidden", "Playlist does not belong to user")
  }

  const eligibleTrackCount = playlist.tracks.filter((playlistTrack) =>
    hasPlayablePreview(playlistTrack.track)
  ).length

  return {
    ...toPlaylistSummary(playlist, playlist.tracks.length, eligibleTrackCount),
    tracks: playlist.tracks.map((playlistTrack) => ({
      id: playlistTrack.id,
      position: playlistTrack.position,
      track: toTrack(playlistTrack.track),
    })),
  }
}

async function requireDraftPlaylist(playlistId: string, ownerUserId: string) {
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } })
  if (!playlist) {
    throw new PlaylistError("playlist_not_found", "Playlist not found")
  }
  if (playlist.ownerUserId !== ownerUserId) {
    throw new PlaylistError("playlist_forbidden", "Playlist does not belong to user")
  }
  if (playlist.status !== "DRAFT") {
    throw new PlaylistError("playlist_not_draft", "Playlist is already published")
  }

  return playlist
}

export async function addTrackToPlaylist(
  playlistId: string,
  ownerUserId: string,
  trackId: string
): Promise<PlaylistDetail> {
  assertDatabaseConfigured()
  await requireDraftPlaylist(playlistId, ownerUserId)

  const currentTrackCount = await prisma.playlistTrack.count({ where: { playlistId } })
  if (currentTrackCount >= GUESS_MAX_PLAYLIST_TRACKS) {
    throw new PlaylistError(
      "playlist_track_limit_reached",
      `Playlist already has the maximum of ${GUESS_MAX_PLAYLIST_TRACKS} tracks`,
      { maxTracks: GUESS_MAX_PLAYLIST_TRACKS }
    )
  }

  // Re-fetch server-side: this upsert can create a new row in the shared Track catalog,
  // so client-supplied metadata is never trusted.
  const deezerId = trackId.startsWith("deezer_") ? trackId.slice("deezer_".length) : trackId
  const candidate = await fetchDeezerTrackById(deezerId)
  if (!candidate) {
    throw new PlaylistError("track_not_found", "Track not found or has no preview available")
  }

  // fetchDeezerTrackById only returns tracks with a live preview, so previewUrl is non-null here.
  const trackFields = {
    catalogBucket: candidate.catalogBucket ?? "general",
    name: candidate.name,
    artist: candidate.artist,
    albumImage: candidate.albumImage,
    previewUrl: candidate.previewUrl,
    previewSource: candidate.previewSource ?? "deezer",
    previewCheckedAt: new Date(),
    bpm: candidate.bpm,
    duration: candidate.duration,
    genre: candidate.genre,
    year: candidate.year,
    energy: candidate.energy ?? null,
    valence: candidate.valence ?? null,
    danceability: candidate.danceability ?? null,
  }

  await prisma.track.upsert({
    where: { id: candidate.id },
    create: { id: candidate.id, ...trackFields },
    update: trackFields,
  })

  // position uses max + 1 so removals never make a new track collide with an existing one.
  // The playlist row lock keeps concurrent adds from exceeding the track cap.
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Playlist" WHERE "id" = ${playlistId} FOR UPDATE`

    const lockedTrackCount = await tx.playlistTrack.count({ where: { playlistId } })
    if (lockedTrackCount >= GUESS_MAX_PLAYLIST_TRACKS) {
      throw new PlaylistError(
        "playlist_track_limit_reached",
        `Playlist already has the maximum of ${GUESS_MAX_PLAYLIST_TRACKS} tracks`,
        { maxTracks: GUESS_MAX_PLAYLIST_TRACKS }
      )
    }

    const lastPosition = await tx.playlistTrack.aggregate({
      where: { playlistId },
      _max: { position: true },
    })
    await tx.playlistTrack.upsert({
      where: { playlistId_trackId: { playlistId, trackId: candidate.id } },
      create: { playlistId, trackId: candidate.id, position: (lastPosition._max.position ?? -1) + 1 },
      update: {},
    })
  })

  return getOwnedPlaylistDetail(playlistId, ownerUserId)
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  ownerUserId: string,
  trackId: string
): Promise<PlaylistDetail> {
  assertDatabaseConfigured()
  await requireDraftPlaylist(playlistId, ownerUserId)

  await prisma.playlistTrack.deleteMany({ where: { playlistId, trackId } })

  return getOwnedPlaylistDetail(playlistId, ownerUserId)
}

// Deezer/iTunes leave energy/valence/danceability null for the whole catalog, so decoy
// candidates are scored instead of hard-filtered: energy when present, year proximity as
// the always-available "vibe" signal so decoys stay in the same broad bucket and era.
function scoreDecoyCandidate(candidate: PrismaTrack, correctTrack: PrismaTrack): number {
  let score = 0
  if (correctTrack.energy !== null && candidate.energy !== null) {
    score -= Math.abs(candidate.energy - correctTrack.energy) * 10
  }
  score -= Math.abs(candidate.year - correctTrack.year) * 0.15
  return score
}

function pickFromScoredPool(
  pool: PrismaTrack[],
  correctTrack: PrismaTrack,
  usedDecoyIds: Set<string>
): PrismaTrack | null {
  if (pool.length === 0) {
    return null
  }

  const freshPool = pool.filter((track) => !usedDecoyIds.has(track.id))
  const candidates = freshPool.length > 0 ? freshPool : pool
  const ranked = [...candidates].sort(
    (a, b) => scoreDecoyCandidate(b, correctTrack) - scoreDecoyCandidate(a, correctTrack)
  )
  const topPool = ranked.slice(0, Math.min(DECOY_TOP_CANDIDATES, ranked.length))
  return randomItem(topPool)
}

interface DecoyPools {
  sameBucket: Map<string, PrismaTrack[]>
  anyBucket: PrismaTrack[] | null
}

function createDecoyPools(): DecoyPools {
  return { sameBucket: new Map(), anyBucket: null }
}

async function pickDecoyTrack(
  correctTrack: PrismaTrack,
  excludedTrackIds: string[],
  usedDecoyIds: Set<string>,
  pools: DecoyPools
): Promise<PrismaTrack> {
  let sameBucketPool = pools.sameBucket.get(correctTrack.catalogBucket)
  if (!sameBucketPool) {
    sameBucketPool = await prisma.track.findMany({
      where: {
        id: { notIn: excludedTrackIds },
        catalogBucket: correctTrack.catalogBucket,
        previewUrl: { not: null },
      },
      take: DECOY_CANDIDATE_POOL_SIZE,
    })
    pools.sameBucket.set(correctTrack.catalogBucket, sameBucketPool)
  }

  const validSameBucket = sameBucketPool.filter((track) => hasPlayablePreview(track))
  const fromSameBucket = pickFromScoredPool(validSameBucket, correctTrack, usedDecoyIds)
  if (fromSameBucket) {
    return fromSameBucket
  }

  if (!pools.anyBucket) {
    pools.anyBucket = await prisma.track.findMany({
      where: { id: { notIn: excludedTrackIds }, previewUrl: { not: null } },
      take: DECOY_CANDIDATE_POOL_SIZE * 2,
    })
  }

  const validAnyBucket = pools.anyBucket.filter((track) => hasPlayablePreview(track))
  const fromAnyBucket = pickFromScoredPool(validAnyBucket, correctTrack, usedDecoyIds)
  if (fromAnyBucket) {
    return fromAnyBucket
  }

  throw new PlaylistError("insufficient_tracks", "No decoy track available in catalog for this list")
}

async function loadEligibleDraftTracks(
  playlistId: string,
  ownerUserId: string
): Promise<{ roundCount: number; listTrackIds: string[]; eligibleTracks: PrismaTrack[] }> {
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: { tracks: { include: { track: true } } },
  })

  if (!playlist) {
    throw new PlaylistError("playlist_not_found", "Playlist not found")
  }
  if (playlist.ownerUserId !== ownerUserId) {
    throw new PlaylistError("playlist_forbidden", "Playlist does not belong to user")
  }
  if (playlist.status !== "DRAFT") {
    throw new PlaylistError("playlist_not_draft", "Playlist is already published")
  }

  const roundCount = playlist.roundCount
  const listTrackIds = playlist.tracks.map((playlistTrack) => playlistTrack.trackId)
  const eligibleTracks = playlist.tracks
    .map((playlistTrack) => playlistTrack.track)
    .filter((track) => hasPlayablePreview(track))

  if (eligibleTracks.length < roundCount) {
    throw new PlaylistError(
      "insufficient_tracks",
      `Playlist needs at least ${roundCount} tracks with a valid preview, has ${eligibleTracks.length}`,
      { eligibleTrackCount: eligibleTracks.length, requiredTrackCount: roundCount }
    )
  }

  return { roundCount, listTrackIds, eligibleTracks }
}

export interface RoundPreviewPair {
  correctTrack: Track
  decoyTrack: Track
}

/** Dry run of the publish algorithm: picks a few sample rounds without persisting
 * anything, so the owner can preview what their friends will get before the
 * irreversible publish. */
export async function previewPublishRounds(
  playlistId: string,
  ownerUserId: string,
  sampleSize = 2
): Promise<RoundPreviewPair[]> {
  assertDatabaseConfigured()
  const { listTrackIds, eligibleTracks } = await loadEligibleDraftTracks(playlistId, ownerUserId)

  const sample = shuffleTracks(eligibleTracks).slice(0, sampleSize)
  const usedDecoyIds = new Set<string>()
  const pools = createDecoyPools()
  const pairs: RoundPreviewPair[] = []

  for (const correctTrack of sample) {
    const decoy = await pickDecoyTrack(correctTrack, listTrackIds, usedDecoyIds, pools)
    usedDecoyIds.add(decoy.id)
    pairs.push({ correctTrack: toTrack(correctTrack), decoyTrack: toTrack(decoy) })
  }

  return pairs
}

export async function publishPlaylist(playlistId: string, ownerUserId: string): Promise<PlaylistDetail> {
  assertDatabaseConfigured()
  const { roundCount, listTrackIds, eligibleTracks } = await loadEligibleDraftTracks(playlistId, ownerUserId)

  const correctTracks = shuffleTracks(eligibleTracks).slice(0, roundCount)
  const usedDecoyIds = new Set<string>()
  const pools = createDecoyPools()
  const rounds: { roundIndex: number; correctTrackId: string; decoyTrackId: string }[] = []

  for (let roundIndex = 0; roundIndex < correctTracks.length; roundIndex += 1) {
    const correctTrack = correctTracks[roundIndex]
    const decoy = await pickDecoyTrack(correctTrack, listTrackIds, usedDecoyIds, pools)
    usedDecoyIds.add(decoy.id)
    rounds.push({ roundIndex, correctTrackId: correctTrack.id, decoyTrackId: decoy.id })
  }

  try {
    await prisma.$transaction([
      prisma.guessRound.createMany({ data: rounds.map((round) => ({ playlistId, ...round })) }),
      prisma.playlist.update({
        where: { id: playlistId },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      }),
    ])
  } catch (error) {
    // A concurrent publish already created the rounds for this playlist.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new PlaylistError("playlist_not_draft", "Playlist is already published")
    }
    throw error
  }

  return getOwnedPlaylistDetail(playlistId, ownerUserId)
}

export async function getPublicPlaylistInfo(playlistToken: string): Promise<PublicPlaylistInfo | null> {
  assertDatabaseConfigured()
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistToken } })
  if (!playlist || playlist.status !== "PUBLISHED" || !playlist.publishedAt) {
    return null
  }

  return {
    token: playlist.id,
    title: playlist.title,
    ownerUserId: playlist.ownerUserId,
    roundCount: playlist.roundCount,
    publishedAt: playlist.publishedAt.toISOString(),
  }
}

async function requirePublishedPlaylist(playlistToken: string) {
  const playlist = await prisma.playlist.findUnique({ where: { id: playlistToken } })
  if (!playlist || playlist.status !== "PUBLISHED") {
    throw new PlaylistError("playlist_not_found", "Playlist not found")
  }

  return playlist
}

export async function startAttempt(
  playlistToken: string,
  playerUserId: string,
  nickname: string
): Promise<{ alreadyCompleted: boolean; summary?: GuessAttemptSummary }> {
  assertDatabaseConfigured()
  const playlist = await requirePublishedPlaylist(playlistToken)
  if (playlist.ownerUserId === playerUserId) {
    throw new PlaylistError("owner_cannot_play", "Owner cannot play their own playlist")
  }

  await ensureUser(playerUserId)

  const existing = await prisma.playlistAttempt.findUnique({
    where: { playlistId_playerUserId: { playlistId: playlist.id, playerUserId } },
  })

  if (existing) {
    return {
      alreadyCompleted: Boolean(existing.completedAt),
      summary: existing.completedAt ? toAttemptSummary(existing) : undefined,
    }
  }

  const trimmedNickname = nickname.trim().slice(0, 40) || "Anónimo"
  await prisma.playlistAttempt.create({
    data: {
      playlistId: playlist.id,
      playerUserId,
      nickname: trimmedNickname,
      totalRounds: playlist.roundCount,
    },
  })

  return { alreadyCompleted: false }
}

export async function getCurrentRound(playlistToken: string, playerUserId: string): Promise<GuessRoundState> {
  assertDatabaseConfigured()
  const playlist = await requirePublishedPlaylist(playlistToken)
  if (playlist.ownerUserId === playerUserId) {
    throw new PlaylistError("owner_cannot_play", "Owner cannot play their own playlist")
  }

  const attempt = await prisma.playlistAttempt.findUnique({
    where: { playlistId_playerUserId: { playlistId: playlist.id, playerUserId } },
    include: { answers: true },
  })

  if (!attempt) {
    throw new PlaylistError("attempt_not_found", "Call start before requesting a round")
  }

  const roundIndex = attempt.answers.length
  if (attempt.completedAt || roundIndex >= attempt.totalRounds) {
    return { status: "completed", summary: toAttemptSummary(attempt) }
  }

  const round = await prisma.guessRound.findUnique({
    where: { playlistId_roundIndex: { playlistId: playlist.id, roundIndex } },
    include: { correctTrack: true, decoyTrack: true },
  })

  if (!round) {
    throw new PlaylistError("playlist_not_found", "Round not found")
  }

  const correctCard = toTrack(round.correctTrack)
  const decoyCard = toTrack(round.decoyTrack)
  const [cardA, cardB] = Math.random() < 0.5 ? [correctCard, decoyCard] : [decoyCard, correctCard]

  return {
    status: "in_progress",
    round: { roundIndex, totalRounds: attempt.totalRounds, cardA, cardB },
  }
}

export async function submitAnswer(
  playlistToken: string,
  playerUserId: string,
  roundIndex: number,
  chosenTrackId: string
): Promise<GuessAnswerResult> {
  assertDatabaseConfigured()

  return prisma.$transaction(async (tx) => {
    const playlist = await tx.playlist.findUnique({ where: { id: playlistToken } })
    if (!playlist || playlist.status !== "PUBLISHED") {
      throw new PlaylistError("playlist_not_found", "Playlist not found")
    }

    const attempt = await tx.playlistAttempt.findUnique({
      where: { playlistId_playerUserId: { playlistId: playlist.id, playerUserId } },
      include: { answers: true },
    })

    if (!attempt) {
      throw new PlaylistError("attempt_not_found", "Call start before answering")
    }
    if (attempt.completedAt) {
      throw new PlaylistError("round_out_of_sequence", "Attempt already completed")
    }

    const expectedRoundIndex = attempt.answers.length
    if (roundIndex !== expectedRoundIndex) {
      throw new PlaylistError("round_out_of_sequence", "Round index does not match the next expected round")
    }

    const round = await tx.guessRound.findUnique({
      where: { playlistId_roundIndex: { playlistId: playlist.id, roundIndex } },
    })
    if (!round) {
      throw new PlaylistError("playlist_not_found", "Round not found")
    }
    if (chosenTrackId !== round.correctTrackId && chosenTrackId !== round.decoyTrackId) {
      throw new PlaylistError("invalid_choice", "Chosen track does not belong to this round")
    }

    const correct = chosenTrackId === round.correctTrackId
    const isFinished = expectedRoundIndex + 1 >= attempt.totalRounds

    try {
      await tx.playlistAttemptAnswer.create({
        data: { attemptId: attempt.id, roundIndex, chosenTrackId, correct },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new PlaylistError("round_out_of_sequence", "This round was already answered")
      }
      throw error
    }

    const updatedAttempt = await tx.playlistAttempt.update({
      where: { id: attempt.id },
      data: {
        score: correct ? attempt.score + 1 : attempt.score,
        completedAt: isFinished ? new Date() : undefined,
      },
    })

    return {
      correct,
      correctTrackId: round.correctTrackId,
      isFinished,
      score: updatedAttempt.score,
      totalRounds: updatedAttempt.totalRounds,
      percentage: toPercentage(updatedAttempt.score, updatedAttempt.totalRounds),
    }
  })
}

export async function getLeaderboard(playlistToken: string): Promise<LeaderboardEntry[]> {
  assertDatabaseConfigured()
  const attempts = await prisma.playlistAttempt.findMany({
    where: { playlistId: playlistToken, completedAt: { not: null } },
    orderBy: [{ score: "desc" }, { completedAt: "asc" }],
    take: 100,
  })

  return attempts.map((attempt) => ({
    attemptId: attempt.id,
    nickname: attempt.nickname,
    score: attempt.score,
    totalRounds: attempt.totalRounds,
    percentage: toPercentage(attempt.score, attempt.totalRounds),
    completedAt: (attempt.completedAt as Date).toISOString(),
  }))
}
