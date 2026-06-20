/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const { prisma } = require("../.tmp-test/lib/db")
const { MOCK_TRACKS } = require("../.tmp-test/lib/mock-data")
const { MUSIC_DNA_UNLOCK_THRESHOLD } = require("../.tmp-test/lib/music-dna-config")
const battleStore = require("../.tmp-test/lib/battle-store")
const battleRoute = require("../.tmp-test/app/api/battle/route")

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

test.before(async () => {
  try {
    await prisma.$connect()
  } catch (error) {
    throw new Error(`Database is required for tests. Start Postgres and set DATABASE_URL. ${String(error)}`)
  }
})

test("GET /api/battle returns a pending battle payload", async () => {
  await seedBaselineTracks()

  const request = new Request("http://localhost:3000/api/battle?userId=api-user")
  const response = await battleRoute.GET(request)
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(payload.status, "PENDING")
  assert.equal(payload.userId, "api-user")
  assert.ok(payload.id)
  assert.notEqual(payload.trackA.id, payload.trackB.id)
})

test("POST /api/battle accepts first vote and rejects concurrent second vote", async () => {
  await seedBaselineTracks()
  const battle = await battleStore.createPendingBattle("api-concurrency-user")

  const winnerId = battle.trackA.id
  const loserId = battle.trackB.id
  const body = JSON.stringify({
    battleId: battle.id,
    winnerId,
    loserId,
    userId: "api-concurrency-user",
  })

  const firstRequest = new Request("http://localhost:3000/api/battle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  })
  const secondRequest = new Request("http://localhost:3000/api/battle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  })

  const [firstResponse, secondResponse] = await Promise.all([
    battleRoute.POST(firstRequest),
    battleRoute.POST(secondRequest),
  ])

  const statuses = [firstResponse.status, secondResponse.status].sort((a, b) => a - b)
  assert.deepEqual(statuses, [200, 409])
})

test("POST /api/battle marks profile unlock on the threshold vote", async () => {
  await seedBaselineTracks()
  const userId = "api-profile-unlock-user"

  for (let index = 0; index < MUSIC_DNA_UNLOCK_THRESHOLD - 1; index += 1) {
    const battle = await battleStore.createPendingBattle(userId)
    await battleStore.completeBattleVote({
      battleId: battle.id,
      winnerId: battle.trackA.id,
      loserId: battle.trackB.id,
      userId,
    })
  }

  const battle = await battleStore.createPendingBattle(userId)
  const request = new Request("http://localhost:3000/api/battle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      battleId: battle.id,
      winnerId: battle.trackA.id,
      loserId: battle.trackB.id,
      userId,
    }),
  })

  const response = await battleRoute.POST(request)
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(payload.profileUnlock, {
    justUnlocked: true,
    completedBattlesCount: MUSIC_DNA_UNLOCK_THRESHOLD,
    threshold: MUSIC_DNA_UNLOCK_THRESHOLD,
  })
})

test.after(async () => {
  await cleanupSyntheticTracks()
  await prisma.$disconnect()
})
