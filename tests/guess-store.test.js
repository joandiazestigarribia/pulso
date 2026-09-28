/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const { prisma } = require("../.tmp-test/lib/db")
const {
  createDraftPlaylist,
  getCurrentRound,
  getLeaderboard,
  publishPlaylist,
  PlaylistError,
  startAttempt,
  submitAnswer,
} = require("../.tmp-test/lib/guess-store")
const { mergeAnonymousBattlesToUser } = require("../.tmp-test/lib/auth")

const PREVIEW_URL = "https://tests.invalid/preview.mp3"

async function wipeGuessTestData() {
  await prisma.playlistAttemptAnswer.deleteMany()
  await prisma.playlistAttempt.deleteMany()
  await prisma.guessRound.deleteMany()
  await prisma.playlistTrack.deleteMany()
  await prisma.playlist.deleteMany()
  await prisma.track.deleteMany()
  await prisma.user.deleteMany()
}

async function makeTrack(id, overrides = {}) {
  return prisma.track.create({
    data: {
      id,
      catalogBucket: "rock",
      name: `Track ${id}`,
      artist: `Artist ${id}`,
      albumImage: "/placeholder.jpg",
      previewUrl: PREVIEW_URL,
      previewSource: "itunes",
      previewCheckedAt: new Date(),
      bpm: 120,
      duration: "03:00",
      genre: "Rock",
      year: 2020,
      energy: 0.5,
      valence: 0.5,
      danceability: 0.5,
      ...overrides,
    },
  })
}

async function addToPlaylist(playlistId, trackId, position) {
  await prisma.playlistTrack.create({ data: { playlistId, trackId, position } })
}

async function createPublishedPlaylist(ownerId, decoyCount = 5) {
  const playlist = await createDraftPlaylist(ownerId, "QA playlist")

  for (let index = 0; index < 15; index += 1) {
    const track = await makeTrack(`${ownerId}_list_${index}`)
    await addToPlaylist(playlist.id, track.id, index)
  }

  for (let index = 0; index < decoyCount; index += 1) {
    await makeTrack(`${ownerId}_decoy_${index}`)
  }

  return publishPlaylist(playlist.id, ownerId)
}

test.before(async () => {
  try {
    await prisma.$connect()
  } catch (error) {
    throw new Error(`Database is required for tests. Start Postgres and set TEST_DATABASE_URL. ${String(error)}`)
  }
})

test("publishPlaylist blocks below the minimum eligible tracks", async () => {
  await wipeGuessTestData()
  const ownerId = "owner_insufficient"
  const playlist = await createDraftPlaylist(ownerId, "Muy corta")

  for (let i = 0; i < 5; i += 1) {
    const track = await makeTrack(`short_${i}`)
    await addToPlaylist(playlist.id, track.id, i)
  }

  await assert.rejects(
    () => publishPlaylist(playlist.id, ownerId),
    (error) => {
      assert.ok(error instanceof PlaylistError)
      assert.equal(error.code, "insufficient_tracks")
      return true
    }
  )
})

test("publishPlaylist generates exactly roundCount rounds with no repeated correct track", async () => {
  await wipeGuessTestData()
  const ownerId = "owner_full"
  const playlist = await createDraftPlaylist(ownerId, "Lista completa")

  const listTrackIds = []
  for (let i = 0; i < 15; i += 1) {
    const track = await makeTrack(`list_${i}`)
    listTrackIds.push(track.id)
    await addToPlaylist(playlist.id, track.id, i)
  }

  // Decoy pool: same bucket/energy neighborhood, but outside the list.
  for (let i = 0; i < 10; i += 1) {
    await makeTrack(`decoy_${i}`)
  }

  const published = await publishPlaylist(playlist.id, ownerId)
  assert.equal(published.status, "PUBLISHED")

  const rounds = await prisma.guessRound.findMany({
    where: { playlistId: playlist.id },
    orderBy: { roundIndex: "asc" },
  })
  assert.equal(rounds.length, 15)
  assert.deepEqual(
    rounds.map((round) => round.roundIndex),
    Array.from({ length: 15 }, (_, index) => index)
  )

  const correctTrackIds = rounds.map((round) => round.correctTrackId)
  assert.equal(new Set(correctTrackIds).size, 15, "each correct track should be used exactly once")
  for (const id of correctTrackIds) {
    assert.ok(listTrackIds.includes(id), "correct track must come from the playlist")
  }
  for (const round of rounds) {
    assert.ok(!listTrackIds.includes(round.decoyTrackId), "decoy must not already be in the playlist")
  }
})

test("publishPlaylist falls back to any available track when no same-bucket decoy exists", async () => {
  await wipeGuessTestData()
  const ownerId = "owner_fallback"
  const playlist = await createDraftPlaylist(ownerId, "Genero de nicho")

  const listTrackIds = []
  for (let i = 0; i < 15; i += 1) {
    const track = await makeTrack(`niche_${i}`, { catalogBucket: "niche_genre", energy: 0.9 })
    listTrackIds.push(track.id)
    await addToPlaylist(playlist.id, track.id, i)
  }

  // Only decoy candidates in the whole catalog are in a different bucket/energy range,
  // forcing the cross-bucket fallback path.
  for (let i = 0; i < 5; i += 1) {
    await makeTrack(`other_${i}`, { catalogBucket: "pop", energy: 0.1 })
  }

  const published = await publishPlaylist(playlist.id, ownerId)
  assert.equal(published.status, "PUBLISHED")

  const rounds = await prisma.guessRound.findMany({ where: { playlistId: playlist.id } })
  assert.equal(rounds.length, 15)
  for (const round of rounds) {
    assert.ok(!listTrackIds.includes(round.decoyTrackId))
  }
})

test("submitAnswer persists sequential answers and completes the attempt", async () => {
  await wipeGuessTestData()
  const ownerId = "owner_play_flow"
  const playlist = await createPublishedPlaylist(ownerId)
  const playerId = "anon_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
  await startAttempt(playlist.id, playerId, "Player")

  let expectedScore = 0

  for (let roundIndex = 0; roundIndex < playlist.roundCount; roundIndex += 1) {
    const state = await getCurrentRound(playlist.id, playerId)
    assert.equal(state.status, "in_progress")
    assert.equal(state.round.roundIndex, roundIndex)
    assert.equal(state.round.totalRounds, playlist.roundCount)
    assert.notEqual(state.round.cardA.id, state.round.cardB.id)

    const result = await submitAnswer(playlist.id, playerId, roundIndex, state.round.cardA.id)
    if (result.correct) {
      expectedScore += 1
    }

    assert.equal(result.score, expectedScore)
    assert.equal(result.totalRounds, playlist.roundCount)
    assert.equal(result.isFinished, roundIndex === playlist.roundCount - 1)
    assert.ok(result.correctTrackId === state.round.cardA.id || result.correctTrackId === state.round.cardB.id)
  }

  const finalState = await getCurrentRound(playlist.id, playerId)
  assert.equal(finalState.status, "completed")
  assert.equal(finalState.summary.score, expectedScore)
  assert.equal(finalState.summary.totalRounds, playlist.roundCount)
  assert.ok(finalState.summary.attemptId)

  const attempts = await prisma.playlistAttempt.findMany({ where: { playlistId: playlist.id } })
  assert.equal(attempts.length, 1)
  assert.equal(attempts[0].score, expectedScore)
  assert.ok(attempts[0].completedAt)
})

test("submitAnswer rejects out-of-sequence, duplicate and invalid choices", async () => {
  await wipeGuessTestData()
  const ownerId = "owner_sequence_guard"
  const playlist = await createPublishedPlaylist(ownerId)
  const playerId = "anon_bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
  await startAttempt(playlist.id, playerId, "Sequence")

  const state = await getCurrentRound(playlist.id, playerId)
  const firstChoice = state.round.cardA.id
  const secondChoice = state.round.cardB.id

  await assert.rejects(
    () => submitAnswer(playlist.id, playerId, 1, firstChoice),
    (error) => error instanceof PlaylistError && error.code === "round_out_of_sequence"
  )
  await assert.rejects(
    () => submitAnswer(playlist.id, playerId, 0, "not-a-card"),
    (error) => error instanceof PlaylistError && error.code === "invalid_choice"
  )

  await submitAnswer(playlist.id, playerId, 0, firstChoice)

  await assert.rejects(
    () => submitAnswer(playlist.id, playerId, 0, secondChoice),
    (error) => error instanceof PlaylistError && error.code === "round_out_of_sequence"
  )
})

test("owners cannot start or play their own published playlist", async () => {
  await wipeGuessTestData()
  const ownerId = "owner_self_play"
  const playlist = await createPublishedPlaylist(ownerId)

  await assert.rejects(
    () => startAttempt(playlist.id, ownerId, "Owner"),
    (error) => error instanceof PlaylistError && error.code === "owner_cannot_play"
  )
  await assert.rejects(
    () => getCurrentRound(playlist.id, ownerId),
    (error) => error instanceof PlaylistError && error.code === "owner_cannot_play"
  )
})

test("getLeaderboard orders completed attempts by score and exposes attempt ids", async () => {
  await wipeGuessTestData()
  const ownerId = "owner_leaderboard"
  const playlist = await createPublishedPlaylist(ownerId)
  const lowScorer = "anon_cccccccc-cccc-4ccc-8ccc-cccccccccccc"
  const highScorer = "anon_dddddddd-dddd-4ddd-8ddd-dddddddddddd"

  await startAttempt(playlist.id, lowScorer, "Low")
  await startAttempt(playlist.id, highScorer, "High")

  await prisma.playlistAttempt.update({
    where: { playlistId_playerUserId: { playlistId: playlist.id, playerUserId: lowScorer } },
    data: { score: 4, completedAt: new Date("2026-01-01T10:00:00.000Z") },
  })
  await prisma.playlistAttempt.update({
    where: { playlistId_playerUserId: { playlistId: playlist.id, playerUserId: highScorer } },
    data: { score: 12, completedAt: new Date("2026-01-01T11:00:00.000Z") },
  })

  const leaderboard = await getLeaderboard(playlist.id)
  assert.deepEqual(
    leaderboard.map((entry) => entry.nickname),
    ["High", "Low"]
  )
  assert.equal(leaderboard[0].score, 12)
  assert.equal(leaderboard[0].percentage, 80)
  assert.ok(leaderboard[0].attemptId)
  assert.notEqual(leaderboard[0].attemptId, leaderboard[1].attemptId)
})

test("merge moves anonymous playlist attempts to the authenticated user", async () => {
  await wipeGuessTestData()
  const ownerId = "owner_merge_happy"
  const playlist = await createPublishedPlaylist(ownerId)
  const anonymousId = "anon_eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"
  const targetUserId = "auth_merge_play_attempt"

  await startAttempt(playlist.id, anonymousId, "Anon")

  const result = await mergeAnonymousBattlesToUser({ anonymousId, targetUserId })
  assert.equal(result.status, "MERGED")
  assert.equal(result.movedAttempts, 1)
  assert.equal(result.movedPlaylists, 0)

  const attempts = await prisma.playlistAttempt.findMany({ where: { playlistId: playlist.id } })
  assert.equal(attempts.length, 1)
  assert.equal(attempts[0].playerUserId, targetUserId)
  assert.equal(attempts[0].nickname, "Anon")

  const anonymousUser = await prisma.user.findUnique({ where: { id: anonymousId } })
  assert.equal(anonymousUser, null)
})

test("merge resolves an attempt conflict in favor of the most advanced attempt", async () => {
  await wipeGuessTestData()
  const ownerId = "owner_merge_conflict"
  const playlist = await createPublishedPlaylist(ownerId)
  const anonymousId = "anon_ffffffff-ffff-4fff-8fff-ffffffffffff"
  const targetUserId = "auth_merge_conflict"

  await startAttempt(playlist.id, anonymousId, "Anon Completed")
  await startAttempt(playlist.id, targetUserId, "User In Progress")

  await prisma.playlistAttempt.update({
    where: { playlistId_playerUserId: { playlistId: playlist.id, playerUserId: anonymousId } },
    data: { score: 9, completedAt: new Date("2026-01-02T10:00:00.000Z") },
  })

  const result = await mergeAnonymousBattlesToUser({ anonymousId, targetUserId })
  assert.equal(result.status, "MERGED")
  assert.equal(result.movedAttempts, 1)
  assert.equal(result.movedBattles, 0)

  const attempts = await prisma.playlistAttempt.findMany({ where: { playlistId: playlist.id } })
  assert.equal(attempts.length, 1)
  assert.equal(attempts[0].playerUserId, targetUserId)
  assert.equal(attempts[0].nickname, "Anon Completed")
  assert.equal(attempts[0].score, 9)
  assert.ok(attempts[0].completedAt)

  const audits = await prisma.mergeAudit.findMany({ where: { targetUserId } })
  assert.equal(audits.length, 1)
  assert.equal(audits[0].movedAttempts, 1)
  assert.equal(audits[0].status, "MERGED")
})

test("merge keeps the target attempt when it is the most advanced", async () => {
  await wipeGuessTestData()
  const ownerId = "owner_merge_keep_target"
  const playlist = await createPublishedPlaylist(ownerId)
  const anonymousId = "anon_99999999-9999-4999-8999-999999999999"
  const targetUserId = "auth_merge_keep_target"

  await startAttempt(playlist.id, anonymousId, "Anon In Progress")
  await startAttempt(playlist.id, targetUserId, "User Completed")

  await prisma.playlistAttempt.update({
    where: { playlistId_playerUserId: { playlistId: playlist.id, playerUserId: targetUserId } },
    data: { score: 15, completedAt: new Date("2026-01-03T10:00:00.000Z") },
  })

  const result = await mergeAnonymousBattlesToUser({ anonymousId, targetUserId })
  assert.equal(result.movedAttempts, 0)

  const attempts = await prisma.playlistAttempt.findMany({ where: { playlistId: playlist.id } })
  assert.equal(attempts.length, 1)
  assert.equal(attempts[0].playerUserId, targetUserId)
  assert.equal(attempts[0].nickname, "User Completed")

  const anonymousUser = await prisma.user.findUnique({ where: { id: anonymousId } })
  assert.equal(anonymousUser, null)
})

test.after(async () => {
  await wipeGuessTestData()
  await prisma.$disconnect()
})
