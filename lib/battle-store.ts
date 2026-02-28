import { Prisma, type BattleState as PrismaBattleState } from "@prisma/client"
import { z } from "zod"
import { assertDatabaseConfigured, prisma } from "@/lib/db"
import { calculateElo } from "@/lib/elo"
import { MOCK_TRACKS, type Battle, type BattleState, type Track } from "@/lib/mock-data"
import { fetchSpotifyBattleTracks } from "@/lib/spotify"

const MATCHMAKING_ELO_THRESHOLD = 200
const SPOTIFY_REFRESH_MS = 1000 * 60 * 30

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

function toTrack(track: {
  id: string
  name: string
  artist: string
  albumImage: string
  previewUrl: string | null
  eloScore: number
  battlesCount: number
  bpm: number
  duration: string
  genre: string
  year: number
}): Track {
  return {
    id: track.id,
    name: track.name,
    artist: track.artist,
    albumImage: track.albumImage,
    previewUrl: track.previewUrl,
    eloScore: track.eloScore,
    battlesCount: track.battlesCount,
    bpm: track.bpm,
    duration: track.duration,
    genre: track.genre,
    year: track.year,
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
          name: track.name,
          artist: track.artist,
          albumImage: track.albumImage,
          previewUrl: track.previewUrl,
          bpm: track.bpm,
          duration: track.duration,
          genre: track.genre,
          year: track.year,
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

function selectBattlePair(tracks: Track[]): { trackA: Track; trackB: Track } {
  const firstTrack = weightedRandomTrack(tracks)
  const closeCandidates = tracks.filter(
    (track) =>
      track.id !== firstTrack.id &&
      Math.abs(track.eloScore - firstTrack.eloScore) < MATCHMAKING_ELO_THRESHOLD
  )

  if (closeCandidates.length > 0) {
    return { trackA: firstTrack, trackB: randomItem(closeCandidates) }
  }

  const fallbackCandidates = tracks.filter((track) => track.id !== firstTrack.id)
  return { trackA: firstTrack, trackB: weightedRandomTrack(fallbackCandidates) }
}

export async function ensureBattleCatalog(): Promise<void> {
  assertDatabaseConfigured()
  await seedCatalogIfEmpty()

  if (Date.now() - lastSpotifySyncAt < SPOTIFY_REFRESH_MS) {
    return
  }

  const spotifyTracks = await fetchSpotifyBattleTracks()
  lastSpotifySyncAt = Date.now()

  if (spotifyTracks.length < 2) {
    return
  }

  await prisma.$transaction(
    spotifyTracks.map((track) =>
      prisma.track.upsert({
        where: { id: track.id },
        create: track,
        update: {
          name: track.name,
          artist: track.artist,
          albumImage: track.albumImage,
          previewUrl: track.previewUrl,
          bpm: track.bpm,
          duration: track.duration,
          genre: track.genre,
          year: track.year,
        },
      })
    )
  )
}

export async function createPendingBattle(userId: string): Promise<Battle> {
  assertDatabaseConfigured()
  await seedCatalogIfEmpty()
  await ensureUser(userId)

  const trackRows = await prisma.track.findMany()
  if (trackRows.length < 2) {
    throw new Error("At least two tracks are required to create a battle")
  }

  const tracks = trackRows.map(toTrack)
  const { trackA, trackB } = selectBattlePair(tracks)
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
