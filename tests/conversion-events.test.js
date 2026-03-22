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
  const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const authUserId = `auth_user_${runId}`
  const anonA = `anon_funnel_a_${runId}`
  const anonB = `anon_funnel_b_${runId}`
  const metricsFrom = new Date(Date.now() - 60_000)
  const metricsTo = new Date(Date.now() + 5 * 60_000)

  await prisma.user.upsert({
    where: { id: authUserId },
    create: { id: authUserId },
    update: {},
  })

  await trackConversionEvent({
    eventName: "battle_started",
    anonymousId: anonA,
  })
  await trackConversionEvent({
    eventName: "vote_submitted",
    anonymousId: anonA,
  })
  await trackConversionEvent({
    eventName: "auth_completed",
    userId: authUserId,
  })
  await trackConversionEvent({
    eventName: "merge_completed",
    userId: authUserId,
    metadata: {
      sourceAnonymousId: anonA,
      movedBattles: 1,
    },
  })
  await trackConversionEvent({
    eventName: "vote_submitted",
    anonymousId: anonB,
  })

  const metrics = await getConversionFunnelMetrics({
    from: metricsFrom,
    to: metricsTo,
  })

  assert.equal(metrics.counts.battle_started >= 1, true)
  assert.equal(metrics.counts.vote_submitted >= 2, true)
  assert.equal(metrics.counts.auth_completed >= 1, true)
  assert.equal(metrics.counts.merge_completed >= 1, true)
  assert.equal(metrics.uniqueActors.firstVote >= 2, true)
  assert.equal(metrics.uniqueActors.authCompleted >= 1, true)
  assert.equal(metrics.rates.firstVoteToAuth > 0, true)
})

test.after(async () => {
  await prisma.$disconnect()
})
