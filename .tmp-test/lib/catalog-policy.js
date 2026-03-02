"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePolicyValue = normalizePolicyValue;
exports.isArtistBlocked = isArtistBlocked;
exports.getActiveArtistDenylist = getActiveArtistDenylist;
const db_1 = require("@/lib/db");
const POLICY_CACHE_TTL_MS = 1000 * 60;
let artistDenylistCache = null;
let hasCatalogRuleTable = null;
function normalizePolicyValue(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function extractArtistTokens(artist) {
    return artist
        .split(/[,&/]| feat\.?| ft\.?/gi)
        .map((token) => normalizePolicyValue(token))
        .filter((token) => token.length > 0);
}
function isArtistBlocked(artist, denylist) {
    if (denylist.size === 0) {
        return false;
    }
    const normalizedArtist = normalizePolicyValue(artist);
    if (normalizedArtist.length > 0 && denylist.has(normalizedArtist)) {
        return true;
    }
    const tokens = extractArtistTokens(artist);
    return tokens.some((token) => denylist.has(token));
}
async function getActiveArtistDenylist(forceRefresh = false) {
    if (!forceRefresh && artistDenylistCache && artistDenylistCache.expiresAt > Date.now()) {
        return artistDenylistCache.values;
    }
    if (hasCatalogRuleTable === false) {
        return new Set();
    }
    let rules = [];
    try {
        rules = await db_1.prisma.$queryRaw `
      SELECT "pattern"
      FROM "CatalogCurationRule"
      WHERE "type" = 'ARTIST' AND "isActive" = true
    `;
        hasCatalogRuleTable = true;
    }
    catch {
        rules = [];
        hasCatalogRuleTable = false;
    }
    const values = new Set(rules.map((rule) => normalizePolicyValue(rule.pattern)).filter((value) => value.length > 0));
    artistDenylistCache = {
        values,
        expiresAt: Date.now() + POLICY_CACHE_TTL_MS,
    };
    return values;
}
