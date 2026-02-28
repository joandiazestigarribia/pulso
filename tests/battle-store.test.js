/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const { prisma } = require("../.tmp-test/lib/db")
const { MOCK_TRACKS } = require("../.tmp-test/lib/mock-data")
const {
  ensureBattleCatalog,
  createPendingBattle,
  completeBattleVote,
  getBattleHistory,
  getUserBattleStats,
  getLeaderboardTracks,
  VoteError,
} = require("../.tmp-test/lib/battle-store")

async function seedBaselineTracks() {
  await prisma.battle.deleteMany()
  await prisma.musicProfile.deleteMany()
  await prisma.user.deleteMany()
  await prisma.track.deleteMany()

  for (const track of MOCK_TRACKS) {
    await prisma.track.create({
      data: {
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
      },
    })
  }
}

test.before(async () => {
  try {
    await prisma.$connect()
  } catch (error) {
    throw new Error(`Database is required for tests. Start Postgres and set DATABASE_URL. ${String(error)}`)
  }
})

test("createPendingBattle returns a pending battle with two different tracks", async () => {
  await seedBaselineTracks()

  const battle = await createPendingBattle("user-create")
  const persisted = await prisma.battle.findUnique({ where: { id: battle.id } })

  assert.equal(battle.status, "PENDING")
  assert.equal(battle.userId, "user-create")
  assert.equal(battle.winnerId, null)
  assert.notEqual(battle.trackA.id, battle.trackB.id)
  assert.ok(persisted)
  assert.equal(persisted.status, "PENDING")
})

test("completeBattleVote updates battle status and ratings atomically", async () => {
  await seedBaselineTracks()
  const battle = await createPendingBattle("user-vote-success")
  const winnerId = battle.trackA.id
  const loserId = battle.trackB.id

  const beforeWinner = await prisma.track.findUnique({ where: { id: winnerId } })
  const beforeLoser = await prisma.track.findUnique({ where: { id: loserId } })

  assert.ok(beforeWinner)
  assert.ok(beforeLoser)

  const result = await completeBattleVote({
    battleId: battle.id,
    winnerId,
    loserId,
    userId: "user-vote-success",
  })

  const persistedBattle = await prisma.battle.findUnique({ where: { id: battle.id } })
  const afterWinner = await prisma.track.findUnique({ where: { id: winnerId } })
  const afterLoser = await prisma.track.findUnique({ where: { id: loserId } })

  assert.equal(result.battle.status, "COMPLETED")
  assert.equal(result.battle.winnerId, winnerId)
  assert.ok(result.winner.eloChange > 0)
  assert.ok(result.loser.eloChange < 0)
  assert.ok(persistedBattle)
  assert.equal(persistedBattle.status, "COMPLETED")
  assert.ok(afterWinner)
  assert.ok(afterLoser)
  assert.equal(afterWinner.eloScore, result.winner.newElo)
  assert.equal(afterLoser.eloScore, result.loser.newElo)
  assert.equal(afterWinner.battlesCount, beforeWinner.battlesCount + 1)
  assert.equal(afterLoser.battlesCount, beforeLoser.battlesCount + 1)
})

test("completeBattleVote rejects second vote on same battle", async () => {
  await seedBaselineTracks()
  const battle = await createPendingBattle("user-double-vote")
  const winnerId = battle.trackA.id
  const loserId = battle.trackB.id

  await completeBattleVote({
    battleId: battle.id,
    winnerId,
    loserId,
    userId: "user-double-vote",
  })

  await assert.rejects(
    async () =>
      completeBattleVote({
        battleId: battle.id,
        winnerId,
        loserId,
        userId: "user-double-vote",
      }),
    (error) => error instanceof VoteError && error.code === "battle_already_completed"
  )
})

test("completeBattleVote enforces battle ownership", async () => {
  await seedBaselineTracks()
  const battle = await createPendingBattle("owner-user")

  await assert.rejects(
    async () =>
      completeBattleVote({
        battleId: battle.id,
        winnerId: battle.trackA.id,
        loserId: battle.trackB.id,
        userId: "other-user",
      }),
    (error) => error instanceof VoteError && error.code === "battle_forbidden_user"
  )
})

test(
  "history and stats are tracked per user and can be filtered by track",
  async () => {
    await seedBaselineTracks()
    const battle = await createPendingBattle("history-user")
    const winnerId = battle.trackA.id
    const loserId = battle.trackB.id

    await completeBattleVote({
      battleId: battle.id,
      winnerId,
      loserId,
      userId: "history-user",
    })

    const userHistory = await getBattleHistory({ userId: "history-user", limit: 10 })
    const trackHistory = await getBattleHistory({ trackId: winnerId, limit: 10 })
    const stats = await getUserBattleStats("history-user")

    assert.ok(userHistory.length >= 1)
    assert.equal(userHistory[0].userId, "history-user")
    assert.ok(trackHistory.some((entry) => entry.trackAId === winnerId || entry.trackBId === winnerId))
    assert.ok(stats.completedBattlesCount >= 1)
  }
)

test("leaderboard returns tracks sorted by elo desc", async () => {
  await seedBaselineTracks()
  await ensureBattleCatalog()

  const leaderboard = await getLeaderboardTracks()
  assert.ok(leaderboard.length >= 2)

  for (let i = 1; i < leaderboard.length; i += 1) {
    assert.ok(leaderboard[i - 1].eloScore >= leaderboard[i].eloScore)
  }
})

test.after(async () => {
  await prisma.$disconnect()
})
