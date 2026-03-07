"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMusicProfileState = getMusicProfileState;
const db_1 = require("@/lib/db");
const genre_normalization_1 = require("@/lib/genre-normalization");
const PROFILE_UNLOCK_THRESHOLD = 10;
const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
function clampUnitValue(value) {
    if (value === null) {
        return null;
    }
    if (!Number.isFinite(value)) {
        return null;
    }
    return Math.max(0, Math.min(1, value));
}
function roundToThree(value) {
    return Number(value.toFixed(3));
}
function average(values) {
    const valid = values.filter((value) => typeof value === "number" && Number.isFinite(value));
    if (valid.length === 0) {
        return null;
    }
    const sum = valid.reduce((total, value) => total + value, 0);
    return roundToThree(sum / valid.length);
}
function toDecadeLabel(year) {
    if (!Number.isFinite(year) || year < 1900) {
        return "Unknown";
    }
    const decade = Math.floor(year / 10) * 10;
    return `${decade}s`;
}
function computeNormalizedEntropy(counts) {
    const total = counts.reduce((sum, value) => sum + value, 0);
    if (total === 0 || counts.length <= 1) {
        return 0;
    }
    let entropy = 0;
    for (const count of counts) {
        if (count === 0) {
            continue;
        }
        const probability = count / total;
        entropy -= probability * Math.log2(probability);
    }
    const maxEntropy = Math.log2(counts.length);
    if (maxEntropy <= 0) {
        return 0;
    }
    return roundToThree(Math.max(0, Math.min(1, entropy / maxEntropy)));
}
function normalizeGenreLabel(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}
function selectWinnerTrack(battle) {
    if (battle.winnerId === battle.trackA.id) {
        return battle.trackA;
    }
    if (battle.winnerId === battle.trackB.id) {
        return battle.trackB;
    }
    return null;
}
function aggregateWinnerPreferences(completedBattles) {
    const winners = completedBattles
        .map((battle) => selectWinnerTrack(battle))
        .filter((track) => track !== null);
    const genreCountMap = new Map();
    const weightedGenreCountMap = new Map();
    const subgenreCountMap = new Map();
    const decadeCountMap = new Map();
    const totalWinners = winners.length;
    for (const [index, winnerTrack] of winners.entries()) {
        const normalizedGenre = (0, genre_normalization_1.normalizeTrackGenre)(winnerTrack.genre);
        const recencyBoost = totalWinners > 0 ? 1 + ((totalWinners - index) / totalWinners) * 0.35 : 1;
        const genre = normalizedGenre.macroGenre;
        const decade = toDecadeLabel(winnerTrack.year);
        genreCountMap.set(genre, (genreCountMap.get(genre) ?? 0) + 1);
        weightedGenreCountMap.set(genre, roundToThree((weightedGenreCountMap.get(genre) ?? 0) + recencyBoost));
        if (normalizedGenre.subgenre) {
            subgenreCountMap.set(normalizedGenre.subgenre, (subgenreCountMap.get(normalizedGenre.subgenre) ?? 0) + 1);
        }
        decadeCountMap.set(decade, (decadeCountMap.get(decade) ?? 0) + 1);
    }
    const topGenres = Array.from(genreCountMap.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 3)
        .map(([genre, count]) => ({ genre, count }));
    const topGenreLabelSet = new Set(topGenres.map((entry) => normalizeGenreLabel(entry.genre)));
    const topSubgenres = Array.from(subgenreCountMap.entries())
        .sort((left, right) => right[1] - left[1])
        .filter(([genre]) => !topGenreLabelSet.has(normalizeGenreLabel(genre)))
        .slice(0, 3)
        .map(([genre, count]) => ({ genre, count }));
    const dominantGenre = Array.from(weightedGenreCountMap.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
    const genreVarietyScore = computeNormalizedEntropy(Array.from(genreCountMap.values()));
    const averageEnergy = clampUnitValue(average(winners.map((track) => track.energy)));
    const averageValence = clampUnitValue(average(winners.map((track) => track.valence)));
    const averageDanceability = clampUnitValue(average(winners.map((track) => track.danceability)));
    return {
        sampleSize: winners.length,
        dominantGenre,
        genreVarietyScore,
        averageEnergy,
        averageValence,
        averageDanceability,
        decadeDistribution: Object.fromEntries(Array.from(decadeCountMap.entries()).sort((left, right) => right[1] - left[1])),
        topGenres,
        topSubgenres,
    };
}
function levelFromValue(value) {
    if (value === null) {
        return "balanced";
    }
    if (value < 0.4) {
        return "low";
    }
    if (value > 0.65) {
        return "high";
    }
    return "balanced";
}
function buildFallbackSummary(aggregated) {
    const dominantGenre = aggregated.dominantGenre ?? "eclectic blend";
    const varietyBand = aggregated.genreVarietyScore >= 0.7 ? "high variety" : aggregated.genreVarietyScore >= 0.4 ? "balanced variety" : "focused taste";
    const energyBand = levelFromValue(aggregated.averageEnergy);
    const valenceBand = levelFromValue(aggregated.averageValence);
    const danceBand = levelFromValue(aggregated.averageDanceability);
    const topDecade = Object.entries(aggregated.decadeDistribution)[0]?.[0] ?? "mixed decades";
    const topSubgenre = aggregated.topSubgenres.find((entry) => normalizeGenreLabel(entry.genre) !== normalizeGenreLabel(dominantGenre))?.genre;
    if (topSubgenre) {
        return `You gravitate toward ${dominantGenre} (${topSubgenre}) with ${varietyBand}. Your winning picks trend ${energyBand} energy, ${valenceBand} mood, and ${danceBand} danceability, with strongest pull from ${topDecade}.`;
    }
    return `You gravitate toward ${dominantGenre} with ${varietyBand}. Your winning picks trend ${energyBand} energy, ${valenceBand} mood, and ${danceBand} danceability, with strongest pull from ${topDecade}.`;
}
function buildTeaserHint(aggregated, completedBattlesCount) {
    if (completedBattlesCount === 0) {
        return "Play your first battle to start shaping your Music DNA.";
    }
    if (completedBattlesCount < 4) {
        return "Early trend detected. Keep voting to stabilize your genre signal.";
    }
    const dominantGenre = aggregated.dominantGenre ?? "mixed genres";
    const energyBand = levelFromValue(aggregated.averageEnergy);
    if (completedBattlesCount < PROFILE_UNLOCK_THRESHOLD) {
        return `Your early winners lean toward ${dominantGenre} with ${energyBand} energy. ${PROFILE_UNLOCK_THRESHOLD - completedBattlesCount} more battles to unlock full Music DNA.`;
    }
    return "Music DNA is unlocked. Open your full profile for the generated persona.";
}
async function generateSummaryWithOpenAI(aggregated) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return null;
    }
    const prompt = [
        "You are a concise music taste analyst.",
        "Write 2 short sentences (max 45 words total) describing this listener persona.",
        "Avoid bullet points and avoid mentioning percentages.",
        `Top genres: ${aggregated.topGenres.map((entry) => `${entry.genre} (${entry.count})`).join(", ") || "none"}.`,
        `Top subgenres: ${aggregated.topSubgenres.map((entry) => `${entry.genre} (${entry.count})`).join(", ") || "none"}.`,
        `Dominant genre: ${aggregated.dominantGenre ?? "none"}.`,
        `Variety score (0-1): ${aggregated.genreVarietyScore}.`,
        `Average energy: ${aggregated.averageEnergy ?? "n/a"}.`,
        `Average valence: ${aggregated.averageValence ?? "n/a"}.`,
        `Average danceability: ${aggregated.averageDanceability ?? "n/a"}.`,
        `Decades: ${Object.entries(aggregated.decadeDistribution)
            .map(([decade, count]) => `${decade} (${count})`)
            .join(", ") || "none"}.`,
    ].join("\n");
    const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: OPENAI_MODEL,
            input: prompt,
            max_output_tokens: 120,
        }),
        cache: "no-store",
    });
    if (!response.ok) {
        return null;
    }
    const payload = (await response.json());
    const text = payload.output
        ?.flatMap((item) => item.content ?? [])
        .find((item) => item.type === "output_text" || typeof item.text === "string")
        ?.text
        ?.trim();
    if (!text || text.length === 0) {
        return null;
    }
    return text;
}
function toProfileSnapshot(profile) {
    const decadeDistribution = profile.decadeDistribution && typeof profile.decadeDistribution === "object"
        ? profile.decadeDistribution
        : {};
    return {
        summary: profile.summary,
        dominantGenre: profile.dominantGenre,
        genreVarietyScore: roundToThree(profile.genreVarietyScore ?? 0),
        averageEnergy: clampUnitValue(profile.averageEnergy),
        averageValence: clampUnitValue(profile.averageValence),
        averageDanceability: clampUnitValue(profile.averageDanceability),
        decadeDistribution,
        generatedFromVotes: profile.generatedFromVotes,
        updatedAt: profile.updatedAt.toISOString(),
    };
}
async function loadCompletedBattles(userId) {
    return db_1.prisma.battle.findMany({
        where: {
            userId,
            status: "COMPLETED",
            winnerId: { not: null },
            loserId: { not: null },
        },
        select: {
            winnerId: true,
            trackA: {
                select: {
                    id: true,
                    genre: true,
                    year: true,
                    energy: true,
                    valence: true,
                    danceability: true,
                },
            },
            trackB: {
                select: {
                    id: true,
                    genre: true,
                    year: true,
                    energy: true,
                    valence: true,
                    danceability: true,
                },
            },
        },
        orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
    });
}
async function getMusicProfileState(userId, options = {}) {
    const completedBattles = await loadCompletedBattles(userId);
    const completedBattlesCount = completedBattles.length;
    const aggregated = aggregateWinnerPreferences(completedBattles);
    const unlockThreshold = PROFILE_UNLOCK_THRESHOLD;
    const remainingBattles = Math.max(0, unlockThreshold - completedBattlesCount);
    const unlocked = completedBattlesCount >= unlockThreshold;
    const teaser = {
        hint: buildTeaserHint(aggregated, completedBattlesCount),
        completedBattlesCount,
        unlockThreshold,
        remainingBattles,
        topGenres: aggregated.topGenres,
        topSubgenres: aggregated.topSubgenres,
        averageEnergy: aggregated.averageEnergy,
        averageValence: aggregated.averageValence,
        averageDanceability: aggregated.averageDanceability,
    };
    if (!unlocked) {
        return {
            unlockThreshold,
            completedBattlesCount,
            unlocked,
            profile: null,
            teaser,
            error: null,
        };
    }
    const existingProfile = await db_1.prisma.musicProfile.findUnique({
        where: { userId },
    });
    const shouldRegenerate = options.forceRegenerate === true ||
        !existingProfile ||
        existingProfile.generatedFromVotes < completedBattlesCount;
    if (!shouldRegenerate && existingProfile) {
        return {
            unlockThreshold,
            completedBattlesCount,
            unlocked,
            profile: toProfileSnapshot(existingProfile),
            teaser,
            error: null,
        };
    }
    try {
        const generatedSummary = await generateSummaryWithOpenAI(aggregated);
        const summary = generatedSummary ?? buildFallbackSummary(aggregated);
        const persisted = await db_1.prisma.musicProfile.upsert({
            where: { userId },
            create: {
                userId,
                summary,
                dominantGenre: aggregated.dominantGenre,
                genreVarietyScore: aggregated.genreVarietyScore,
                averageEnergy: aggregated.averageEnergy,
                averageValence: aggregated.averageValence,
                averageDanceability: aggregated.averageDanceability,
                decadeDistribution: aggregated.decadeDistribution,
                generatedFromVotes: completedBattlesCount,
            },
            update: {
                summary,
                dominantGenre: aggregated.dominantGenre,
                genreVarietyScore: aggregated.genreVarietyScore,
                averageEnergy: aggregated.averageEnergy,
                averageValence: aggregated.averageValence,
                averageDanceability: aggregated.averageDanceability,
                decadeDistribution: aggregated.decadeDistribution,
                generatedFromVotes: completedBattlesCount,
            },
        });
        return {
            unlockThreshold,
            completedBattlesCount,
            unlocked,
            profile: toProfileSnapshot(persisted),
            teaser,
            error: null,
        };
    }
    catch {
        return {
            unlockThreshold,
            completedBattlesCount,
            unlocked,
            profile: existingProfile ? toProfileSnapshot(existingProfile) : null,
            teaser,
            error: {
                code: "PROFILE_GENERATION_FAILED",
                message: "Music DNA generation is temporarily unavailable. Please retry in a moment.",
            },
        };
    }
}
