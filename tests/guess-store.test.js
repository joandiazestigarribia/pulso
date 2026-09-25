/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const { prisma } = require("../.tmp-test/lib/db")
const { createDraftPlaylist, publishPlaylist, PlaylistError } = require("../.tmp-test/lib/guess-store")

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

test.after(async () => {
  await wipeGuessTestData()
  await prisma.$disconnect()
})
