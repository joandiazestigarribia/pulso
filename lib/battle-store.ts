import { z } from "zod"
import { calculateElo } from "@/lib/elo"
import { MOCK_TRACKS, type Battle, type BattleState, type Track } from "@/lib/mock-data"
import { fetchSpotifyBattleTracks } from "@/lib/spotify"

const MATCHMAKING_ELO_THRESHOLD = 200
const SPOTIFY_REFRESH_MS = 1000 * 60 * 30
const PENDING_BATTLE_TTL_MS = 1000 * 60 * 30
const MAX_HISTORY_ENTRIES = 2000

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

const tracks = MOCK_TRACKS.map((track) => ({ ...track }))
const pendingBattles = new Map<string, Battle>()
const battleHistory: BattleHistoryEntry[] = []
let lastSpotifySyncAt = 0

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

function selectBattlePair(): { trackA: Track; trackB: Track } {
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

function prunePendingBattles(): void {
  const now = Date.now()

  for (const [battleId, battle] of pendingBattles.entries()) {
    const createdAtMs = Date.parse(battle.createdAt)
    if (!Number.isFinite(createdAtMs)) {
      pendingBattles.delete(battleId)
      continue
    }

    if (now - createdAtMs > PENDING_BATTLE_TTL_MS) {
      pendingBattles.delete(battleId)
    }
  }
}

function pruneHistory(): void {
  if (battleHistory.length > MAX_HISTORY_ENTRIES) {
    battleHistory.splice(MAX_HISTORY_ENTRIES)
  }
}

export async function ensureBattleCatalog(): Promise<void> {
  if (Date.now() - lastSpotifySyncAt < SPOTIFY_REFRESH_MS) {
    return
  }

  const spotifyTracks = await fetchSpotifyBattleTracks()
  lastSpotifySyncAt = Date.now()

  if (spotifyTracks.length < 2) {
    return
  }

  const previousById = new Map(tracks.map((track) => [track.id, track]))
  const hydratedTracks = spotifyTracks.map((spotifyTrack) => {
    const previous = previousById.get(spotifyTrack.id)
    if (!previous) {
      return spotifyTrack
    }

    return {
      ...spotifyTrack,
      eloScore: previous.eloScore,
      battlesCount: previous.battlesCount,
    }
  })

  tracks.splice(0, tracks.length, ...hydratedTracks)
}

export function createPendingBattle(userId: string): Battle {
  prunePendingBattles()

  const { trackA, trackB } = selectBattlePair()
  const battle: Battle = {
    id: crypto.randomUUID(),
    trackA,
    trackB,
    userId,
    status: "PENDING",
    winnerId: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  }

  pendingBattles.set(battle.id, battle)
  return battle
}

function findTrackById(id: string): Track | undefined {
  return tracks.find((track) => track.id === id)
}

export function completeBattleVote(payload: BattleVotePayload): BattleVoteResult {
  prunePendingBattles()

  const { battleId, userId, winnerId, loserId } = payload

  if (winnerId === loserId) {
    throw new VoteError("vote_same_track", "winnerId and loserId must be different")
  }

  const battle = pendingBattles.get(battleId)
  if (!battle) {
    throw new VoteError("battle_not_found", "Battle not found")
  }

  if (battle.status !== "PENDING") {
    throw new VoteError("battle_already_completed", "Battle already completed")
  }

  if (battle.userId !== userId) {
    throw new VoteError("battle_forbidden_user", "Battle does not belong to user")
  }

  const validIds = [battle.trackA.id, battle.trackB.id]
  if (!validIds.includes(winnerId) || !validIds.includes(loserId)) {
    throw new VoteError("vote_does_not_match_battle", "Vote does not match battle tracks")
  }

  const winner = findTrackById(winnerId)
  const loser = findTrackById(loserId)
  if (!winner || !loser) {
    throw new VoteError("track_not_found", "Track not found")
  }

  const previousWinnerElo = winner.eloScore
  const previousLoserElo = loser.eloScore
  const previousWinnerBattles = winner.battlesCount
  const previousLoserBattles = loser.battlesCount
  const previousBattleStatus = battle.status
  const previousBattleWinner = battle.winnerId
  const previousBattleCompletedAt = battle.completedAt

  try {
    const { newWinnerElo, newLoserElo } = calculateElo(previousWinnerElo, previousLoserElo)

    winner.eloScore = newWinnerElo
    winner.battlesCount = previousWinnerBattles + 1
    loser.eloScore = newLoserElo
    loser.battlesCount = previousLoserBattles + 1

    battle.status = "COMPLETED"
    battle.winnerId = winner.id
    battle.completedAt = new Date().toISOString()

    battleHistory.unshift({
      battleId: battle.id,
      userId,
      status: battle.status,
      winnerId: winner.id,
      loserId: loser.id,
      trackAId: battle.trackA.id,
      trackBId: battle.trackB.id,
      trackAName: battle.trackA.name,
      trackBName: battle.trackB.name,
      winnerEloChange: newWinnerElo - previousWinnerElo,
      loserEloChange: newLoserElo - previousLoserElo,
      createdAt: battle.createdAt,
      completedAt: battle.completedAt,
    })
    pruneHistory()

    return {
      battle: {
        id: battle.id,
        status: battle.status,
        winnerId: battle.winnerId,
        completedAt: battle.completedAt,
      },
      winner: {
        id: winner.id,
        name: winner.name,
        newElo: newWinnerElo,
        eloChange: newWinnerElo - previousWinnerElo,
        battlesCount: winner.battlesCount,
      },
      loser: {
        id: loser.id,
        name: loser.name,
        newElo: newLoserElo,
        eloChange: newLoserElo - previousLoserElo,
        battlesCount: loser.battlesCount,
      },
    }
  } catch (error) {
    winner.eloScore = previousWinnerElo
    winner.battlesCount = previousWinnerBattles
    loser.eloScore = previousLoserElo
    loser.battlesCount = previousLoserBattles
    battle.status = previousBattleStatus
    battle.winnerId = previousBattleWinner
    battle.completedAt = previousBattleCompletedAt
    throw error
  }
}

export function getBattleHistory(params: {
  userId?: string
  trackId?: string
  limit?: number
}): BattleHistoryEntry[] {
  const limit = Math.max(1, params.limit ?? 20)

  return battleHistory
    .filter((entry) => {
      if (params.userId && entry.userId !== params.userId) {
        return false
      }

      if (
        params.trackId &&
        entry.trackAId !== params.trackId &&
        entry.trackBId !== params.trackId
      ) {
        return false
      }

      return true
    })
    .slice(0, limit)
}

export function getUserBattleStats(userId: string): {
  completedBattlesCount: number
} {
  const completedBattlesCount = battleHistory.reduce((count, entry) => {
    if (entry.userId !== userId) {
      return count
    }

    return count + 1
  }, 0)

  return { completedBattlesCount }
}

export function getLeaderboardTracks(): Track[] {
  return [...tracks].sort((a, b) => b.eloScore - a.eloScore)
}
