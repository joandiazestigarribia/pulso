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

let hasCatalogRuleTable = null

async function catalogRuleTableExists() {
  if (typeof hasCatalogRuleTable === "boolean") {
    return hasCatalogRuleTable
  }

  try {
    await prisma.$queryRaw`SELECT 1 FROM "CatalogCurationRule" LIMIT 1`
    hasCatalogRuleTable = true
  } catch {
    hasCatalogRuleTable = false
  }

  return hasCatalogRuleTable
}

async function seedBaselineTracks() {
  if (await catalogRuleTableExists()) {
    await prisma.$executeRawUnsafe('DELETE FROM "CatalogCurationRule"')
  }
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
      OR: [
        { id: { in: baselineIds } },
        { id: { startsWith: "ratio_" } },
        { id: { startsWith: "f9_" } },
        { id: { startsWith: "theme_" } },
        { id: { startsWith: "external_health_" } },
      ],
    },
  })
}

async function ensureHealthyExternalPreviewCatalog() {
  await prisma.track.updateMany({
    data: {
      previewUrl: "https://p.scdn.co/mp3-preview/pulso-test.mp3",
      previewSource: "deezer",
    },
  })

  const externalCount = await prisma.track.count({
    where: {
      previewUrl: { not: null },
      previewSource: { in: ["deezer", "itunes"] },
    },
  })

  const requiredExtraTracks = Math.max(0, 8 - externalCount)
  for (let index = 0; index < requiredExtraTracks; index += 1) {
    await prisma.track.upsert({
      where: { id: `external_health_${index}` },
      create: {
        id: `external_health_${index}`,
        catalogBucket: "pop",
        name: `External Health ${index}`,
        artist: `External Artist ${index}`,
        albumImage: "/placeholder.jpg",
        previewUrl: "https://p.scdn.co/mp3-preview/pulso-health.mp3",
        previewSource: "deezer",
        eloScore: 1500,
        battlesCount: 0,
        bpm: 120,
        duration: "03:00",
        genre: "Pop",
        year: 2024,
      },
      update: {
        previewUrl: "https://p.scdn.co/mp3-preview/pulso-health.mp3",
        previewSource: "deezer",
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

test("createPendingBattle prioritizes tracks with preview when enough are available", async () => {
  await seedBaselineTracks()

  await prisma.track.updateMany({
    where: {
      id: {
        in: ["1", "2"],
      },
    },
    data: {
      previewUrl: "https://tests.invalid/sample-preview.mp3",
    },
  })

  await prisma.track.updateMany({
    where: {
      id: {
        in: ["3", "4", "5", "6"],
      },
    },
    data: {
      previewUrl: null,
    },
  })

  const battle = await createPendingBattle("user-preview-priority")
  assert.equal(Boolean(battle.trackA.previewUrl), true)
  assert.equal(Boolean(battle.trackB.previewUrl), true)

  await prisma.track.updateMany({
    where: {
      id: {
        in: ["1", "2"],
      },
    },
    data: {
      previewUrl: null,
    },
  })
})

test("createPendingBattle keeps hybrid ratio within tolerance with thematic overrides", async () => {
  await seedBaselineTracks()
  await prisma.battle.deleteMany()
  await prisma.track.deleteMany()

  const ratioTracks = [
    { id: "ratio_pop_1", bucket: "pop", name: "Pop One", artist: "Artist A" },
    { id: "ratio_pop_2", bucket: "pop", name: "Pop Two", artist: "Artist B" },
    { id: "ratio_rock_1", bucket: "rock", name: "Rock One", artist: "Artist C" },
    { id: "ratio_rock_2", bucket: "rock", name: "Rock Two", artist: "Artist D" },
    { id: "ratio_urbano_1", bucket: "urbano", name: "Urbano One", artist: "Artist E" },
    { id: "ratio_urbano_2", bucket: "urbano", name: "Urbano Two", artist: "Artist F" },
    { id: "ratio_electronic_1", bucket: "electronic", name: "Electro One", artist: "Artist G" },
    { id: "ratio_electronic_2", bucket: "electronic", name: "Electro Two", artist: "Artist H" },
  ]

  for (const track of ratioTracks) {
    await prisma.track.create({
      data: {
        id: track.id,
        catalogBucket: track.bucket,
        name: track.name,
        artist: track.artist,
        albumImage: "/placeholder.jpg",
        previewUrl: "https://tests.invalid/f9-ratio.mp3",
        eloScore: 1500,
        battlesCount: 0,
        bpm: 120,
        duration: "03:30",
        genre: "Pop",
        year: 2020,
      },
    })
  }

  const totalBattles = 120
  let intraBucketPairs = 0

  for (let index = 0; index < totalBattles; index += 1) {
    const battle = await createPendingBattle("ratio-user")
    if (battle.trackA.catalogBucket === battle.trackB.catalogBucket) {
      intraBucketPairs += 1
    }
  }

  const ratio = intraBucketPairs / totalBattles
  assert.ok(ratio >= 0.3 && ratio <= 0.75)
})

test("createPendingBattle filters likely instrumental and cover candidates when alternatives exist", async () => {
  await seedBaselineTracks()

  await prisma.battle.deleteMany()
  await prisma.track.deleteMany()

  const curatedTracks = [
    {
      id: "f9_clean_1",
      catalogBucket: "rock",
      name: "Everlong",
      artist: "Foo Fighters",
      albumImage: "/placeholder.jpg",
      previewUrl: "https://tests.invalid/everlong.mp3",
      eloScore: 1500,
      battlesCount: 0,
      bpm: 158,
      duration: "04:10",
      genre: "Alternative Rock",
      year: 1997,
    },
    {
      id: "f9_clean_2",
      catalogBucket: "pop",
      name: "Levitating",
      artist: "Dua Lipa",
      albumImage: "/placeholder.jpg",
      previewUrl: "https://tests.invalid/levitating.mp3",
      eloScore: 1500,
      battlesCount: 0,
      bpm: 103,
      duration: "03:24",
      genre: "Pop",
      year: 2020,
    },
    {
      id: "f9_filtered_instrumental",
      catalogBucket: "electronic",
      name: "Sunset Dreams (Instrumental)",
      artist: "Calm Producer",
      albumImage: "/placeholder.jpg",
      previewUrl: "https://tests.invalid/instrumental.mp3",
      eloScore: 1500,
      battlesCount: 0,
      bpm: 90,
      duration: "03:50",
      genre: "Electronic",
      year: 2024,
    },
    {
      id: "f9_filtered_cover",
      catalogBucket: "pop",
      name: "Blinding Lights (Cover)",
      artist: "Tribute Artist",
      albumImage: "/placeholder.jpg",
      previewUrl: "https://tests.invalid/cover.mp3",
      eloScore: 1500,
      battlesCount: 0,
      bpm: 120,
      duration: "03:21",
      genre: "Pop",
      year: 2023,
    },
  ]

  for (const track of curatedTracks) {
    await prisma.track.create({ data: track })
  }

  for (let index = 0; index < 12; index += 1) {
    const battle = await createPendingBattle("heuristics-user")
    assert.equal(battle.trackA.id.includes("f9_filtered"), false)
    assert.equal(battle.trackB.id.includes("f9_filtered"), false)
  }
})

test("createPendingBattle applies dynamic artist denylist rules from database", async () => {
  await seedBaselineTracks()
  await prisma.track.updateMany({
    data: {
      previewUrl: "https://tests.invalid/denylist-preview.mp3",
    },
  })

  if (!(await catalogRuleTableExists())) {
    return
  }

  await prisma.$executeRaw`INSERT INTO "CatalogCurationRule" ("id", "type", "pattern", "isActive", "createdAt", "updatedAt") VALUES ('rule_m83', 'ARTIST', 'M83', true, NOW(), NOW())`

  for (let index = 0; index < 10; index += 1) {
    const battle = await createPendingBattle("denylist-user")
    assert.equal(battle.trackA.artist.includes("M83"), false)
    assert.equal(battle.trackB.artist.includes("M83"), false)
  }
})

test("createPendingBattle applies user cooldown to avoid recently seen artist and title", async () => {
  await seedBaselineTracks()
  await ensureHealthyExternalPreviewCatalog()

  const firstBattle = await createPendingBattle("cooldown-user")
  await completeBattleVote({
    battleId: firstBattle.id,
    winnerId: firstBattle.trackA.id,
    loserId: firstBattle.trackB.id,
    userId: "cooldown-user",
  })

  const secondBattle = await createPendingBattle("cooldown-user")
  const recentArtists = new Set([firstBattle.trackA.artist, firstBattle.trackB.artist])
  const recentTitles = new Set([firstBattle.trackA.name, firstBattle.trackB.name])

  assert.equal(recentArtists.has(secondBattle.trackA.artist), false)
  assert.equal(recentArtists.has(secondBattle.trackB.artist), false)
  assert.equal(recentTitles.has(secondBattle.trackA.name), false)
  assert.equal(recentTitles.has(secondBattle.trackB.name), false)
})

test("createPendingBattle controls artist and title overexposure in matchmaking", async () => {
  await seedBaselineTracks()
  await ensureHealthyExternalPreviewCatalog()

  for (let index = 0; index < 10; index += 1) {
    const userId = `exposure-anchor-${index}`
    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    })

    await prisma.battle.create({
      data: {
        userId,
        trackAId: "1",
        trackBId: "2",
        status: "COMPLETED",
        winnerId: "1",
        loserId: "2",
        winnerEloChange: 16,
        loserEloChange: -16,
        completedAt: new Date(),
      },
    })
  }

  let sawOverexposedTrack = false
  for (let index = 0; index < 10; index += 1) {
    const battle = await createPendingBattle(`exposure-check-user-${index}`)
    if (
      battle.trackA.artist.includes("M83") ||
      battle.trackB.artist.includes("M83") ||
      battle.trackA.name === "Midnight City" ||
      battle.trackB.name === "Midnight City"
    ) {
      sawOverexposedTrack = true
      break
    }
  }

  assert.equal(sawOverexposedTrack, false)
})

test("createPendingBattle can trigger thematic duel rock vs urbano", async () => {
  await seedBaselineTracks()
  await prisma.battle.deleteMany()
  await prisma.track.deleteMany()

  const thematicTracks = [
    {
      id: "theme_rock_1",
      catalogBucket: "rock",
      name: "Rock Theme 1",
      artist: "Rock Artist A",
      albumImage: "/placeholder.jpg",
      previewUrl: "https://tests.invalid/theme-rock-1.mp3",
      eloScore: 1500,
      battlesCount: 0,
      bpm: 122,
      duration: "03:30",
      genre: "Rock",
      year: 2020,
      energy: 0.7,
      valence: 0.6,
      danceability: 0.5,
    },
    {
      id: "theme_rock_2",
      catalogBucket: "indie_alt",
      name: "Rock Theme 2",
      artist: "Rock Artist B",
      albumImage: "/placeholder.jpg",
      previewUrl: "https://tests.invalid/theme-rock-2.mp3",
      eloScore: 1498,
      battlesCount: 0,
      bpm: 124,
      duration: "03:40",
      genre: "Alternative",
      year: 2019,
      energy: 0.72,
      valence: 0.58,
      danceability: 0.52,
    },
    {
      id: "theme_urbano_1",
      catalogBucket: "urbano",
      name: "Urbano Theme 1",
      artist: "Urbano Artist A",
      albumImage: "/placeholder.jpg",
      previewUrl: "https://tests.invalid/theme-urbano-1.mp3",
      eloScore: 1501,
      battlesCount: 0,
      bpm: 126,
      duration: "03:20",
      genre: "Urbano latino",
      year: 2021,
      energy: 0.74,
      valence: 0.62,
      danceability: 0.74,
    },
    {
      id: "theme_urbano_2",
      catalogBucket: "pop",
      name: "Urbano Theme 2",
      artist: "Urbano Artist B",
      albumImage: "/placeholder.jpg",
      previewUrl: "https://tests.invalid/theme-urbano-2.mp3",
      eloScore: 1502,
      battlesCount: 0,
      bpm: 120,
      duration: "03:12",
      genre: "Pop en español",
      year: 2022,
      energy: 0.71,
      valence: 0.64,
      danceability: 0.69,
    },
  ]

  for (const track of thematicTracks) {
    await prisma.track.create({ data: track })
  }

  const originalRandom = Math.random
  Math.random = () => 0

  try {
    const battle = await createPendingBattle("theme-user")
    const leftIsRock = ["rock", "indie_alt"].includes(battle.trackA.catalogBucket ?? "")
    const rightIsUrbano = ["urbano", "pop", "cumbia_latina"].includes(battle.trackB.catalogBucket ?? "")
    assert.equal(leftIsRock, true)
    assert.equal(rightIsUrbano, true)
  } finally {
    Math.random = originalRandom
  }
})

test.after(async () => {
  await cleanupSyntheticTracks()
  await prisma.$disconnect()
})
