"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCatalogText = normalizeCatalogText;
exports.buildTrackDuplicateKey = buildTrackDuplicateKey;
exports.buildTrackTitleKey = buildTrackTitleKey;
exports.extractArtistMatchTokens = extractArtistMatchTokens;
exports.isLikelyInstrumentalTrack = isLikelyInstrumentalTrack;
exports.isLikelyCoverTrack = isLikelyCoverTrack;
exports.isTrackBlockedByCurationHeuristics = isTrackBlockedByCurationHeuristics;
const COVER_MARKERS = [
    " cover",
    "(cover",
    "tribute",
    "karaoke",
    "originally performed by",
    "originally by",
];
const INSTRUMENTAL_MARKERS = [
    "instrumental",
    "no vocals",
    "lofi",
    "lo-fi",
    "study beats",
    "sleep music",
    "meditation",
    "background music",
];
const TITLE_CLEANUP_MARKERS = [
    " feat ",
    " ft ",
    " featuring ",
    " - remaster",
    " remaster",
    " radio edit",
    " live",
];
function normalizeCatalogText(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function normalizeTitleForDupKey(title) {
    let normalized = normalizeCatalogText(title).replace(/\([^)]*\)/g, " ");
    for (const marker of TITLE_CLEANUP_MARKERS) {
        const index = normalized.indexOf(marker);
        if (index >= 0) {
            normalized = normalized.slice(0, index);
        }
    }
    return normalized.replace(/\s+/g, " ").trim();
}
function normalizeArtistForDupKey(artist) {
    const normalized = normalizeCatalogText(artist);
    for (const marker of TITLE_CLEANUP_MARKERS) {
        const index = normalized.indexOf(marker);
        if (index >= 0) {
            return normalized.slice(0, index).trim();
        }
    }
    return normalized;
}
function buildTrackDuplicateKey(track) {
    const normalizedTitle = normalizeTitleForDupKey(track.name);
    const normalizedArtist = normalizeArtistForDupKey(track.artist);
    return `${normalizedTitle}::${normalizedArtist}`;
}
function buildTrackTitleKey(track) {
    return normalizeTitleForDupKey(track.name);
}
function extractArtistMatchTokens(artist) {
    return artist
        .split(/[,&/]| feat\.?| ft\.?/gi)
        .map((token) => normalizeArtistForDupKey(token))
        .filter((token) => token.length > 0);
}
function isLikelyInstrumentalTrack(track) {
    const signal = normalizeCatalogText(`${track.name} ${track.artist} ${track.genre}`);
    return INSTRUMENTAL_MARKERS.some((marker) => signal.includes(marker));
}
function isLikelyCoverTrack(track) {
    const signal = normalizeCatalogText(`${track.name} ${track.artist}`);
    return COVER_MARKERS.some((marker) => signal.includes(marker.trim()));
}
function isTrackBlockedByCurationHeuristics(track) {
    return isLikelyInstrumentalTrack(track) || isLikelyCoverTrack(track);
}
