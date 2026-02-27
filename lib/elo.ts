export const INITIAL_ELO_RATING = 1500
export const ELO_K_FACTOR = 32

export interface EloResult {
  newWinnerElo: number
  newLoserElo: number
  winnerExpectedScore: number
  loserExpectedScore: number
}

export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

export function calculateElo(
  winnerElo: number,
  loserElo: number,
  kFactor = ELO_K_FACTOR
): EloResult {
  const winnerExpectedScore = calculateExpectedScore(winnerElo, loserElo)
  const loserExpectedScore = calculateExpectedScore(loserElo, winnerElo)

  const newWinnerElo = Math.round(winnerElo + kFactor * (1 - winnerExpectedScore))
  const newLoserElo = Math.round(loserElo + kFactor * (0 - loserExpectedScore))

  return {
    newWinnerElo,
    newLoserElo,
    winnerExpectedScore,
    loserExpectedScore,
  }
}