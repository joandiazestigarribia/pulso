"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ELO_K_FACTOR = exports.INITIAL_ELO_RATING = void 0;
exports.calculateExpectedScore = calculateExpectedScore;
exports.calculateElo = calculateElo;
exports.INITIAL_ELO_RATING = 1500;
exports.ELO_K_FACTOR = 32;
function calculateExpectedScore(ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}
function calculateElo(winnerElo, loserElo, kFactor = exports.ELO_K_FACTOR) {
    const winnerExpectedScore = calculateExpectedScore(winnerElo, loserElo);
    const loserExpectedScore = calculateExpectedScore(loserElo, winnerElo);
    const newWinnerElo = Math.round(winnerElo + kFactor * (1 - winnerExpectedScore));
    const newLoserElo = Math.round(loserElo + kFactor * (0 - loserExpectedScore));
    return {
        newWinnerElo,
        newLoserElo,
        winnerExpectedScore,
        loserExpectedScore,
    };
}
