/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const { calculateElo, calculateExpectedScore, ELO_K_FACTOR } = require("../.tmp-test/elo")

test("calculateExpectedScore returns 0.5 for equal ratings", () => {
  const expected = calculateExpectedScore(1500, 1500)
  assert.equal(expected, 0.5)
})

test("calculateElo updates winner and loser with K=32", () => {
  const winnerElo = 1500
  const loserElo = 1500

  const result = calculateElo(winnerElo, loserElo, ELO_K_FACTOR)

  assert.equal(result.newWinnerElo, 1516)
  assert.equal(result.newLoserElo, 1484)
})

test("rating gain is smaller when winner starts with higher rating", () => {
  const highRatedWinner = calculateElo(1700, 1300)
  const evenMatchWinner = calculateElo(1500, 1500)

  assert.ok(highRatedWinner.newWinnerElo - 1700 < evenMatchWinner.newWinnerElo - 1500)
})
