/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const { prisma } = require("../.tmp-test/lib/db")
const { MOCK_TRACKS } = require("../.tmp-test/lib/mock-data")
const { createPendingBattle, completeBattleVote } = require("../.tmp-test/lib/battle-store")
const { ensureUserExists, mergeAnonymousBattlesToUser } = require("../.tmp-test/lib/auth")

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

test("mergeAnonymousBattlesToUser moves anonymous history to authenticated user", async () => {
  await seedBaselineTracks()
  const anonymousId = "anon_merge_test"
  const targetUserId = "auth_merge_user"

  const battle = await createPendingBattle(anonymousId)
  await completeBattleVote({
    battleId: battle.id,
    winnerId: battle.trackA.id,
    loserId: battle.trackB.id,
    userId: anonymousId,
  })

  await ensureUserExists(targetUserId)
  const mergeResult = await mergeAnonymousBattlesToUser({
    anonymousId,
    targetUserId,
  })

  const migratedBattle = await prisma.battle.findUnique({ where: { id: battle.id } })
  const audits = await prisma.mergeAudit.findMany({
    where: { targetUserId },
    orderBy: { createdAt: "desc" },
  })

  assert.equal(mergeResult.merged, true)
  assert.equal(mergeResult.movedBattles, 1)
  assert.equal(mergeResult.status, "MERGED")
  assert.ok(mergeResult.auditId)
  assert.ok(migratedBattle)
  assert.equal(migratedBattle.userId, targetUserId)
  assert.equal(audits.length, 1)
  assert.equal(audits[0].status, "MERGED")
  assert.equal(audits[0].movedBattles, 1)
})

test("mergeAnonymousBattlesToUser is idempotent for repeated merge attempts", async () => {
  await seedBaselineTracks()
  const anonymousId = "anon_idempotent"
  const targetUserId = "auth_idempotent"

  const battle = await createPendingBattle(anonymousId)
  await completeBattleVote({
    battleId: battle.id,
    winnerId: battle.trackA.id,
    loserId: battle.trackB.id,
    userId: anonymousId,
  })

  const first = await mergeAnonymousBattlesToUser({
    anonymousId,
    targetUserId,
  })
  const second = await mergeAnonymousBattlesToUser({
    anonymousId,
    targetUserId,
  })
  const audits = await prisma.mergeAudit.findMany({
    where: { targetUserId },
    orderBy: { createdAt: "asc" },
  })

  assert.equal(first.movedBattles, 1)
  assert.equal(first.status, "MERGED")
  assert.equal(second.movedBattles, 0)
  assert.equal(second.merged, false)
  assert.equal(second.status, "NOOP")
  assert.equal(audits.length, 2)
  assert.equal(audits[0].status, "MERGED")
  assert.equal(audits[1].status, "NOOP")
})

test.after(async () => {
  await prisma.$disconnect()
})
