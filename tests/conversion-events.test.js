/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const { prisma } = require("../.tmp-test/lib/db")
const { getConversionFunnelMetrics, trackConversionEvent } = require("../.tmp-test/lib/conversion-events")

async function resetConversionEvents() {
  await prisma.conversionEvent.deleteMany()
}

test.before(async () => {
  try {
    await prisma.$connect()
  } catch (error) {
    throw new Error(`Database is required for tests. Start Postgres and set DATABASE_URL. ${String(error)}`)
  }
})

test("getConversionFunnelMetrics aggregates counts and first-vote-to-auth rate", async () => {
  await resetConversionEvents()
  await prisma.user.upsert({
    where: { id: "auth_user_a" },
    create: { id: "auth_user_a" },
    update: {},
  })

  await trackConversionEvent({
    eventName: "battle_started",
    anonymousId: "anon_funnel_a",
  })
  await trackConversionEvent({
    eventName: "vote_submitted",
    anonymousId: "anon_funnel_a",
  })
  await trackConversionEvent({
    eventName: "auth_completed",
    userId: "auth_user_a",
  })
  await trackConversionEvent({
    eventName: "merge_completed",
    userId: "auth_user_a",
    metadata: {
      sourceAnonymousId: "anon_funnel_a",
      movedBattles: 1,
    },
  })
  await trackConversionEvent({
    eventName: "vote_submitted",
    anonymousId: "anon_funnel_b",
  })

  const metrics = await getConversionFunnelMetrics()

  assert.equal(metrics.counts.battle_started, 1)
  assert.equal(metrics.counts.vote_submitted, 2)
  assert.equal(metrics.counts.auth_completed, 1)
  assert.equal(metrics.counts.merge_completed, 1)
  assert.equal(metrics.uniqueActors.firstVote, 2)
  assert.equal(metrics.uniqueActors.authCompleted >= 1, true)
  assert.equal(metrics.rates.firstVoteToAuth, 0.5)
})

test.after(async () => {
  await prisma.$disconnect()
})
