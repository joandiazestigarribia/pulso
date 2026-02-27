/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const {
  createPendingBattle,
  completeBattleVote,
  getBattleHistory,
  getUserBattleStats,
  getLeaderboardTracks,
  VoteError,
} = require("../.tmp-test/battle-store")

test("createPendingBattle returns a pending battle with two different tracks", () => {
  const battle = createPendingBattle("user-create")

  assert.equal(battle.status, "PENDING")
  assert.equal(battle.userId, "user-create")
  assert.equal(battle.winnerId, null)
  assert.notEqual(battle.trackA.id, battle.trackB.id)
})

test("completeBattleVote updates battle status and ratings", () => {
  const battle = createPendingBattle("user-vote-success")
  const winnerId = battle.trackA.id
  const loserId = battle.trackB.id

  const result = completeBattleVote({
    battleId: battle.id,
    winnerId,
    loserId,
    userId: "user-vote-success",
  })

  assert.equal(result.battle.status, "COMPLETED")
  assert.equal(result.battle.winnerId, winnerId)
  assert.ok(result.winner.newElo > result.loser.newElo || result.winner.eloChange > 0)
  assert.ok(result.winner.eloChange > 0)
  assert.ok(result.loser.eloChange < 0)
})

test("completeBattleVote rejects second vote on same battle", () => {
  const battle = createPendingBattle("user-double-vote")
  const winnerId = battle.trackA.id
  const loserId = battle.trackB.id

  completeBattleVote({
    battleId: battle.id,
    winnerId,
    loserId,
    userId: "user-double-vote",
  })

  assert.throws(
    () =>
      completeBattleVote({
        battleId: battle.id,
        winnerId,
        loserId,
        userId: "user-double-vote",
      }),
    (error) => error instanceof VoteError && error.code === "battle_already_completed"
  )
})

test("completeBattleVote enforces battle ownership", () => {
  const battle = createPendingBattle("owner-user")

  assert.throws(
    () =>
      completeBattleVote({
        battleId: battle.id,
        winnerId: battle.trackA.id,
        loserId: battle.trackB.id,
        userId: "other-user",
      }),
    (error) => error instanceof VoteError && error.code === "battle_forbidden_user"
  )
})

test("history and stats are tracked per user and can be filtered by track", () => {
  const battle = createPendingBattle("history-user")
  const winnerId = battle.trackA.id
  const loserId = battle.trackB.id

  completeBattleVote({
    battleId: battle.id,
    winnerId,
    loserId,
    userId: "history-user",
  })

  const userHistory = getBattleHistory({ userId: "history-user", limit: 10 })
  const trackHistory = getBattleHistory({ trackId: winnerId, limit: 10 })
  const stats = getUserBattleStats("history-user")

  assert.ok(userHistory.length >= 1)
  assert.equal(userHistory[0].userId, "history-user")
  assert.ok(trackHistory.some((entry) => entry.trackAId === winnerId || entry.trackBId === winnerId))
  assert.ok(stats.completedBattlesCount >= 1)
})

test("leaderboard returns tracks sorted by elo desc", () => {
  const leaderboard = getLeaderboardTracks()
  assert.ok(leaderboard.length >= 2)

  for (let i = 1; i < leaderboard.length; i += 1) {
    assert.ok(leaderboard[i - 1].eloScore >= leaderboard[i].eloScore)
  }
})
