import type { Track } from "@/lib/mock-data"
import { INITIAL_ELO_RATING } from "@/lib/elo"
import { DEEZER_PLAYLIST_SOURCES } from "@/lib/deezer-playlists"
import { buildTrackDuplicateKey, isTrackAllowedByManualCuration } from "@/lib/catalog-curation"

const DEEZER_API_URL = "https://api.deezer.com"
const ITUNES_RSS_TOP_SONGS_URL = "https://rss.applemarketingtools.com/api/v2/ar/music/most-played/100/songs.json"
const ITUNES_BUCKET_MIN_TRACKS = 12
const DEEZER_PLAYLIST_MAX_TRACKS = 180
const DEEZER_PLAYLIST_PAGE_SIZE = 100

export type CatalogBucket =
  | "classics_70s_80s_90s"
  | "classics_00s_10s"
  | "rock"
  | "metal_hardrock"
  | "pop"
  | "cumbia_latina"
  | "folk_regional"
  | "urbano"
  | "hiphop_rap"
  | "rnb_soul"
  | "electronic"
  | "indie_alt"

interface ItunesBucketQuery {
  bucket: CatalogBucket
  terms: string[]
}

interface ItunesTrackResult {
  trackId?: number
  wrapperType?: string
  kind?: string
  trackName?: string
  artistName?: string
  previewUrl?: string
  artworkUrl100?: string
  trackTimeMillis?: number
  primaryGenreName?: string
  releaseDate?: string
}

interface ItunesSearchResponse {
  results?: ItunesTrackResult[]
}

interface DeezerArtist {
  name?: string
}

interface DeezerAlbum {
  cover_xl?: string
  cover_big?: string
  cover_medium?: string
  release_date?: string
}

interface DeezerTrackResult {
  id?: number
  title?: string
  artist?: DeezerArtist
  album?: DeezerAlbum
  preview?: string | null
  duration?: number
  release_date?: string
}

interface DeezerPlaylistTracksResponse {
  data?: DeezerTrackResult[]
}

interface DeezerTrackResponse {
  preview?: string | null
}

interface ItunesRssFeedResult {
  id: string
}

interface ItunesRssFeedResponse {
  feed?: {
    results?: ItunesRssFeedResult[]
  }
}

const ITUNES_BUCKET_QUERIES: ItunesBucketQuery[] = [
  {
    bucket: "classics_70s_80s_90s",
    terms: ["80s hits", "90s classics", "rock en espanol 90s", "nostalgia 90s", "baladas 90s", "new wave 80s"],
  },
  {
    bucket: "classics_00s_10s",
    terms: ["2000s pop hits", "2010s hits", "rock 2000s", "nostalgia 2000s", "pop 2000s", "indie 2010s"],
  },
  {
    bucket: "rock",
    terms: ["rock clasicos", "rock internacional hits", "rock nacional argentino", "rock en espanol"],
  },
  {
    bucket: "pop",
    terms: ["pop hits", "global pop hits", "argentina pop hits", "pop en espanol", "latin pop hits", "dance pop hits"],
  },
  {
    bucket: "cumbia_latina",
    terms: ["cumbia argentina", "cumbia villera", "latin cumbia hits", "cumbia santafesina", "cumbia sonidera"],
  },
  {
    bucket: "urbano",
    terms: ["reggaeton hits", "trap latino hits", "urbano latino", "dembow hits", "latin trap"],
  },
  {
    bucket: "electronic",
    terms: ["electronic dance hits", "edm classics", "house hits", "techno hits", "deep house", "drum and bass hits"],
  },
  {
    bucket: "indie_alt",
    terms: ["indie hits", "alternative rock hits", "indie latino", "alternativa", "indie pop", "shoegaze hits"],
  },
]

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function formatDurationSeconds(durationSeconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationSeconds))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function parseItunesYear(releaseDate?: string): number {
  if (!releaseDate) {
    return new Date().getFullYear()
  }

  const parsed = Number.parseInt(releaseDate.slice(0, 4), 10)
  if (Number.isNaN(parsed)) {
    return new Date().getFullYear()
  }

  return parsed
}

function parseDeezerYear(item: DeezerTrackResult): number {
  const releaseDate = item.release_date ?? item.album?.release_date
  if (!releaseDate) {
    return new Date().getFullYear()
  }

  const parsed = Number.parseInt(releaseDate.slice(0, 4), 10)
  if (Number.isNaN(parsed)) {
    return new Date().getFullYear()
  }

  return parsed
}

function toHighResItunesArtwork(url?: string): string {
  if (!url) {
    return "/placeholder.jpg"
  }

  return url.replace(/\/\d+x\d+bb\./, "/600x600bb.")
}

function toHighResDeezerArtwork(album?: DeezerAlbum): string {
  return album?.cover_xl ?? album?.cover_big ?? album?.cover_medium ?? "/placeholder.jpg"
}

function bucketToGenreLabel(bucket: CatalogBucket): string {
  const labels: Record<CatalogBucket, string> = {
    classics_70s_80s_90s: "Classic Rock",
    classics_00s_10s: "2000s/2010s",
    rock: "Rock",
    metal_hardrock: "Metal",
    pop: "Pop",
    cumbia_latina: "Cumbia",
    folk_regional: "Folklore",
    urbano: "Latin Urban",
    hiphop_rap: "Hip Hop",
    rnb_soul: "R&B/Soul",
    electronic: "Electronic",
    indie_alt: "Alternative",
  }

  return labels[bucket]
}

function inferCatalogBucket(trackName: string, artistName: string): CatalogBucket {
  const signal = normalizeForMatch(`${trackName} ${artistName}`)

  if (signal.includes("hip hop") || signal.includes("hip-hop") || signal.includes("rap")) {
    return "hiphop_rap"
  }
  if (signal.includes("r&b") || signal.includes("rnb") || signal.includes("neo soul") || signal.includes("soul")) {
    return "rnb_soul"
  }
  if (signal.includes("folklore") || signal.includes("chacarera") || signal.includes("zamba") || signal.includes("cueca")) {
    return "folk_regional"
  }
  if (
    signal.includes("feat") ||
    signal.includes("bzrp") ||
    signal.includes("bad bunny") ||
    signal.includes("dembow") ||
    signal.includes("reggaeton") ||
    signal.includes("trap latino")
  ) {
    return "urbano"
  }
  if (signal.includes("cumbia") || signal.includes("villera") || signal.includes("sonidera")) {
    return "cumbia_latina"
  }
  if (
    signal.includes("edm") ||
    signal.includes("electronic") ||
    signal.includes("techno") ||
    signal.includes("house") ||
    signal.includes("drum and bass")
  ) {
    return "electronic"
  }
  if (signal.includes("indie") || signal.includes("alternative") || signal.includes("shoegaze") || signal.includes("post punk")) {
    return "indie_alt"
  }
  if (signal.includes("metal") || signal.includes("hard rock") || signal.includes("nu metal")) {
    return "metal_hardrock"
  }
  if (signal.includes("rock") || signal.includes("punk") || signal.includes("grunge")) {
    return "rock"
  }

  return "pop"
}

function toItunesBattleTrack(item: ItunesTrackResult, bucketOverride?: CatalogBucket): Track | null {
  if (!item.trackId || !item.trackName || !item.artistName) {
    return null
  }

  const catalogBucket = bucketOverride ?? inferCatalogBucket(item.trackName, item.artistName)
  const durationMs = typeof item.trackTimeMillis === "number" ? item.trackTimeMillis : 0

  return {
    id: `itunes_${item.trackId}`,
    catalogBucket,
    name: item.trackName,
    artist: item.artistName,
    albumImage: toHighResItunesArtwork(item.artworkUrl100),
    previewUrl: item.previewUrl ?? null,
    previewSource: item.previewUrl ? "itunes" : null,
    previewCheckedAt: new Date().toISOString(),
    eloScore: INITIAL_ELO_RATING,
    battlesCount: 0,
    bpm: 120,
    duration: formatDuration(durationMs),
    genre: item.primaryGenreName ?? bucketToGenreLabel(catalogBucket),
    year: parseItunesYear(item.releaseDate),
    energy: null,
    valence: null,
    danceability: null,
  }
}

function toDeezerBattleTrack(item: DeezerTrackResult, bucketOverride?: CatalogBucket): Track | null {
  if (!item.id || !item.title || !item.artist?.name) {
    return null
  }

  const catalogBucket = bucketOverride ?? inferCatalogBucket(item.title, item.artist.name)
  return {
    id: `deezer_${item.id}`,
    catalogBucket,
    name: item.title,
    artist: item.artist.name,
    albumImage: toHighResDeezerArtwork(item.album),
    previewUrl: item.preview ?? null,
    previewSource: item.preview ? "deezer" : null,
    previewCheckedAt: new Date().toISOString(),
    eloScore: INITIAL_ELO_RATING,
    battlesCount: 0,
    bpm: 120,
    duration: formatDurationSeconds(item.duration ?? 0),
    genre: bucketToGenreLabel(catalogBucket),
    year: parseDeezerYear(item),
    energy: null,
    valence: null,
    danceability: null,
  }
}

function isReasonableItunesMatch(candidate: ItunesTrackResult, trackName: string, artistName: string): boolean {
  const normalizedTargetTrack = normalizeForMatch(trackName)
  const normalizedTargetArtist = normalizeForMatch(artistName)
  const normalizedCandidateTrack = normalizeForMatch(candidate.trackName ?? "")
  const normalizedCandidateArtist = normalizeForMatch(candidate.artistName ?? "")

  const trackMatches =
    normalizedCandidateTrack.includes(normalizedTargetTrack) ||
    normalizedTargetTrack.includes(normalizedCandidateTrack)
  const artistMatches =
    normalizedCandidateArtist.includes(normalizedTargetArtist) ||
    normalizedTargetArtist.includes(normalizedCandidateArtist)

  return trackMatches && artistMatches
}

function pickPreferredTrack(current: Track, candidate: Track): Track {
  const currentPreviewScore = current.previewUrl ? 1 : 0
  const candidatePreviewScore = candidate.previewUrl ? 1 : 0
  if (candidatePreviewScore !== currentPreviewScore) {
    return candidatePreviewScore > currentPreviewScore ? candidate : current
  }

  return candidate.year > current.year ? candidate : current
}

function shuffleTracks<T>(items: T[]): T[] {
  const cloned = [...items]
  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const temp = cloned[index]
    cloned[index] = cloned[swapIndex]
    cloned[swapIndex] = temp
  }
  return cloned
}

function selectBalancedBucketTracks(tracks: Track[], limit: number): Track[] {
  if (tracks.length <= limit) {
    return tracks
  }

  const byBucket = new Map<CatalogBucket, Track[]>()
  for (const track of tracks) {
    const bucket = (track.catalogBucket ?? "pop") as CatalogBucket
    const current = byBucket.get(bucket) ?? []
    current.push(track)
    byBucket.set(bucket, current)
  }

  const entries = Array.from(byBucket.entries()).map(([bucket, bucketTracks]) => ({
    bucket,
    tracks: shuffleTracks(bucketTracks),
  }))

  const selected: Track[] = []
  while (selected.length < limit) {
    let pickedInRound = false
    for (const entry of entries) {
      const candidate = entry.tracks.shift()
      if (!candidate) {
        continue
      }

      selected.push(candidate)
      pickedInRound = true
      if (selected.length >= limit) {
        break
      }
    }

    if (!pickedInRound) {
      break
    }
  }

  return selected
}

async function fetchDeezerPlaylistTracks(playlistId: string, maxTracks: number): Promise<DeezerTrackResult[]> {
  const collected: DeezerTrackResult[] = []

  for (let index = 0; index < maxTracks; index += DEEZER_PLAYLIST_PAGE_SIZE) {
    const remaining = maxTracks - index
    const pageLimit = Math.min(DEEZER_PLAYLIST_PAGE_SIZE, remaining)
    const url = `${DEEZER_API_URL}/playlist/${encodeURIComponent(playlistId)}/tracks?index=${index}&limit=${pageLimit}`
    const response = await fetch(url, { cache: "no-store" })
    if (!response.ok) {
      break
    }

    const payload = (await response.json()) as DeezerPlaylistTracksResponse
    const pageItems = payload.data ?? []
    if (pageItems.length === 0) {
      break
    }

    collected.push(...pageItems)
    if (pageItems.length < pageLimit) {
      break
    }
  }

  return collected
}

export async function fetchItunesPreviewUrl(params: { trackName: string; artistName: string }): Promise<string | null> {
  const term = `${params.trackName} ${params.artistName}`.trim()
  const searchUrl = `https://itunes.apple.com/search?media=music&entity=song&limit=5&term=${encodeURIComponent(term)}`

  try {
    const response = await fetch(searchUrl, { cache: "no-store" })
    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as ItunesSearchResponse
    const candidates = payload.results ?? []
    const exactLike = candidates.find(
      (candidate) => Boolean(candidate.previewUrl) && isReasonableItunesMatch(candidate, params.trackName, params.artistName)
    )
    if (exactLike?.previewUrl) {
      return exactLike.previewUrl
    }

    return candidates.find((candidate) => Boolean(candidate.previewUrl))?.previewUrl ?? null
  } catch {
    return null
  }
}

export async function fetchItunesBattleTracks(limit = 120): Promise<Track[]> {
  try {
    const deduped = new Map<string, Track>()
    const byBucket = new Map<CatalogBucket, number>()

    for (const bucketConfig of ITUNES_BUCKET_QUERIES) {
      byBucket.set(bucketConfig.bucket, 0)

      for (const term of bucketConfig.terms) {
        const url = `https://itunes.apple.com/search?media=music&entity=song&limit=25&term=${encodeURIComponent(term)}`
        const response = await fetch(url, { cache: "no-store" })
        if (!response.ok) {
          continue
        }

        const payload = (await response.json()) as ItunesSearchResponse
        for (const item of payload.results ?? []) {
          const mapped = toItunesBattleTrack(item, bucketConfig.bucket)
          if (!mapped || !mapped.previewUrl || !isTrackAllowedByManualCuration(mapped)) {
            continue
          }

          const dedupeKey = buildTrackDuplicateKey(mapped)
          const current = deduped.get(dedupeKey)
          if (!current) {
            deduped.set(dedupeKey, mapped)
            byBucket.set(bucketConfig.bucket, (byBucket.get(bucketConfig.bucket) ?? 0) + 1)
          } else {
            deduped.set(dedupeKey, pickPreferredTrack(current, mapped))
          }
        }

        if ((byBucket.get(bucketConfig.bucket) ?? 0) >= ITUNES_BUCKET_MIN_TRACKS) {
          break
        }
      }
    }

    const topSongsResponse = await fetch(ITUNES_RSS_TOP_SONGS_URL, { cache: "no-store" })
    if (topSongsResponse.ok) {
      const topSongsPayload = (await topSongsResponse.json()) as ItunesRssFeedResponse
      const rssIds = (topSongsPayload.feed?.results ?? [])
        .map((entry) => Number.parseInt(entry.id, 10))
        .filter((id) => Number.isInteger(id))
        .slice(0, Math.max(limit, 100))

      const chunkSize = 50
      for (let index = 0; index < rssIds.length; index += chunkSize) {
        const chunk = rssIds.slice(index, index + chunkSize)
        const lookupUrl = `https://itunes.apple.com/lookup?id=${encodeURIComponent(chunk.join(","))}&entity=song`
        const lookupResponse = await fetch(lookupUrl, { cache: "no-store" })
        if (!lookupResponse.ok) {
          continue
        }

        const lookupPayload = (await lookupResponse.json()) as ItunesSearchResponse
        for (const item of lookupPayload.results ?? []) {
          if (item.wrapperType !== "track" || item.kind !== "song") {
            continue
          }

          const mapped = toItunesBattleTrack(item)
          if (!mapped || !mapped.previewUrl || !isTrackAllowedByManualCuration(mapped)) {
            continue
          }

          const dedupeKey = buildTrackDuplicateKey(mapped)
          const current = deduped.get(dedupeKey)
          deduped.set(dedupeKey, current ? pickPreferredTrack(current, mapped) : mapped)
        }
      }
    }

    return selectBalancedBucketTracks(Array.from(deduped.values()), limit)
  } catch {
    return []
  }
}

export async function fetchDeezerBattleTracks(limit = 120): Promise<Track[]> {
  try {
    const deduped = new Map<string, Track>()
    for (const source of DEEZER_PLAYLIST_SOURCES) {
      const playlistTracks = await fetchDeezerPlaylistTracks(source.playlistId, DEEZER_PLAYLIST_MAX_TRACKS)
      for (const item of playlistTracks) {
        const mapped = toDeezerBattleTrack(item, source.bucket)
        if (!mapped || !mapped.previewUrl || !isTrackAllowedByManualCuration(mapped)) {
          continue
        }

        const dedupeKey = buildTrackDuplicateKey(mapped)
        const current = deduped.get(dedupeKey)
        if (!current) {
          deduped.set(dedupeKey, mapped)
        } else {
          deduped.set(dedupeKey, pickPreferredTrack(current, mapped))
        }
      }
    }

    return selectBalancedBucketTracks(Array.from(deduped.values()), limit)
  } catch {
    return []
  }
}

export async function fetchDeezerPreviewUrlByTrackId(trackId: string): Promise<string | null> {
  const safeTrackId = trackId.trim()
  if (!/^\d+$/.test(safeTrackId)) {
    return null
  }

  try {
    const url = `${DEEZER_API_URL}/track/${encodeURIComponent(safeTrackId)}`
    const response = await fetch(url, { cache: "no-store" })
    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as DeezerTrackResponse
    return typeof payload.preview === "string" && payload.preview.length > 0 ? payload.preview : null
  } catch {
    return null
  }
}
