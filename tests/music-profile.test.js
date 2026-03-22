/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const { prisma } = require("../.tmp-test/lib/db")
const { MOCK_TRACKS } = require("../.tmp-test/lib/mock-data")
const { createPendingBattle, completeBattleVote } = require("../.tmp-test/lib/battle-store")
const { getMusicProfileState } = require("../.tmp-test/lib/music-profile")
const { MUSIC_DNA_UNLOCK_THRESHOLD } = require("../.tmp-test/lib/music-dna-config")
const { normalizeTrackGenre } = require("../.tmp-test/lib/genre-normalization")

async function seedBaselineTracks() {
  await prisma.battle.deleteMany()
  await prisma.musicProfile.deleteMany()
  await prisma.user.deleteMany()
  await prisma.track.deleteMany()

  for (const track of MOCK_TRACKS) {
    const previewUrl =
      track.id === "1"
        ? "https://tests.invalid/preview-a.mp3"
        : track.id === "2"
          ? "https://tests.invalid/preview-b.mp3"
          : track.previewUrl

    await prisma.track.create({
      data: {
        id: track.id,
        catalogBucket: track.catalogBucket ?? "general",
        name: track.name,
        artist: track.artist,
        albumImage: track.albumImage,
        previewUrl,
        eloScore: track.eloScore,
        battlesCount: track.battlesCount,
        bpm: track.bpm,
        duration: track.duration,
        genre: track.genre,
        year: track.year,
        energy: track.energy ?? null,
        valence: track.valence ?? null,
        danceability: track.danceability ?? null,
      },
    })
  }
}

async function cleanupSyntheticTracks() {
  const baselineIds = MOCK_TRACKS.map((track) => track.id)
  await prisma.battle.deleteMany()
  await prisma.musicProfile.deleteMany()
  await prisma.track.deleteMany({
    where: {
      id: { in: baselineIds },
    },
  })
}

async function completeBattles(userId, count) {
  for (let index = 0; index < count; index += 1) {
    const battle = await createPendingBattle(userId)
    await completeBattleVote({
      battleId: battle.id,
      winnerId: battle.trackA.id,
      loserId: battle.trackB.id,
      userId,
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

test("music profile stays locked before threshold and returns teaser", async () => {
  const targetBattles = Math.max(1, MUSIC_DNA_UNLOCK_THRESHOLD - 7)
  await seedBaselineTracks()
  await completeBattles("music-profile-locked", targetBattles)

  const state = await getMusicProfileState("music-profile-locked")
  assert.equal(state.unlocked, false)
  assert.equal(state.profile, null)
  assert.equal(state.completedBattlesCount, targetBattles)
  assert.equal(state.teaser.remainingBattles, 7)
  assert.equal(state.error, null)
})

test("music profile is generated at threshold and cached from vote count", async () => {
  await seedBaselineTracks()
  await completeBattles("music-profile-unlock", MUSIC_DNA_UNLOCK_THRESHOLD)

  const state = await getMusicProfileState("music-profile-unlock")
  assert.equal(state.unlocked, true)
  assert.ok(state.profile)
  assert.equal(state.profile.generatedFromVotes, MUSIC_DNA_UNLOCK_THRESHOLD)
  assert.equal(typeof state.profile.genreVarietyScore, "number")
  assert.equal(state.error, null)
})

test("music profile regenerates when new battles are completed", async () => {
  await seedBaselineTracks()
  const userId = "music-profile-refresh"
  await completeBattles(userId, MUSIC_DNA_UNLOCK_THRESHOLD)
  const initial = await getMusicProfileState(userId)

  assert.ok(initial.profile)
  assert.equal(initial.profile.generatedFromVotes, MUSIC_DNA_UNLOCK_THRESHOLD)

  await completeBattles(userId, 1)
  const refreshed = await getMusicProfileState(userId)
  assert.ok(refreshed.profile)
  assert.equal(refreshed.profile.generatedFromVotes, MUSIC_DNA_UNLOCK_THRESHOLD + 1)
})

test("genre normalization avoids duplicate macro/subgenre labels", async () => {
  const normalizedRock = normalizeTrackGenre("Rock")
  assert.equal(normalizedRock.macroGenre, "Rock")
  assert.equal(normalizedRock.subgenre, null)

  const normalizedPop = normalizeTrackGenre("Pop")
  assert.equal(normalizedPop.macroGenre, "Pop")
  assert.equal(normalizedPop.subgenre, null)
})

test.after(async () => {
  await cleanupSyntheticTracks()
  await prisma.$disconnect()
})
