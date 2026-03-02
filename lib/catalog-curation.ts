import type { Track } from "@/lib/mock-data"

const COVER_MARKERS = [
  " cover",
  "(cover",
  "tribute",
  "karaoke",
  "originally performed by",
  "originally by",
]

const INSTRUMENTAL_MARKERS = [
  "instrumental",
  "no vocals",
  "lofi",
  "lo-fi",
  "study beats",
  "sleep music",
  "meditation",
  "background music",
]

const TITLE_CLEANUP_MARKERS = [
  " feat ",
  " ft ",
  " featuring ",
  " - remaster",
  " remaster",
  " radio edit",
  " live",
]

export function normalizeCatalogText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeTitleForDupKey(title: string): string {
  let normalized = normalizeCatalogText(title).replace(/\([^)]*\)/g, " ")
  for (const marker of TITLE_CLEANUP_MARKERS) {
    const index = normalized.indexOf(marker)
    if (index >= 0) {
      normalized = normalized.slice(0, index)
    }
  }

  return normalized.replace(/\s+/g, " ").trim()
}

function normalizeArtistForDupKey(artist: string): string {
  const normalized = normalizeCatalogText(artist)
  for (const marker of TITLE_CLEANUP_MARKERS) {
    const index = normalized.indexOf(marker)
    if (index >= 0) {
      return normalized.slice(0, index).trim()
    }
  }

  return normalized
}

export function buildTrackDuplicateKey(track: Pick<Track, "name" | "artist">): string {
  const normalizedTitle = normalizeTitleForDupKey(track.name)
  const normalizedArtist = normalizeArtistForDupKey(track.artist)
  return `${normalizedTitle}::${normalizedArtist}`
}

export function buildTrackTitleKey(track: Pick<Track, "name">): string {
  return normalizeTitleForDupKey(track.name)
}

export function extractArtistMatchTokens(artist: string): string[] {
  return artist
    .split(/[,&/]| feat\.?| ft\.?/gi)
    .map((token) => normalizeArtistForDupKey(token))
    .filter((token) => token.length > 0)
}

export function isLikelyInstrumentalTrack(track: Pick<Track, "name" | "artist" | "genre">): boolean {
  const signal = normalizeCatalogText(`${track.name} ${track.artist} ${track.genre}`)
  return INSTRUMENTAL_MARKERS.some((marker) => signal.includes(marker))
}

export function isLikelyCoverTrack(track: Pick<Track, "name" | "artist">): boolean {
  const signal = normalizeCatalogText(`${track.name} ${track.artist}`)
  return COVER_MARKERS.some((marker) => signal.includes(marker.trim()))
}

export function isTrackBlockedByCurationHeuristics(
  track: Pick<Track, "name" | "artist" | "genre">
): boolean {
  return isLikelyInstrumentalTrack(track) || isLikelyCoverTrack(track)
}
