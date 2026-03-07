import type { Track } from "@/lib/mock-data"
import { INITIAL_ELO_RATING } from "@/lib/elo"
import {
  buildTrackDuplicateKey,
  isTrackAllowedByManualCuration,
} from "@/lib/catalog-curation"

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
const SPOTIFY_API_URL = "https://api.spotify.com/v1"
const DEFAULT_MARKET = "AR"
const SPOTIFY_MIN_POPULARITY = 65
const ITUNES_RSS_TOP_SONGS_URL = "https://rss.applemarketingtools.com/api/v2/ar/music/most-played/100/songs.json"
const ITUNES_BUCKET_MIN_TRACKS = 12

export type CatalogBucket =
  | "classics_70s_80s_90s"
  | "classics_00s_10s"
  | "rock"
  | "pop"
  | "cumbia_latina"
  | "urbano"
  | "electronic"
  | "indie_alt"

interface SpotifyBucketQuery {
  bucket: CatalogBucket
  query: string
}

interface ItunesBucketQuery {
  bucket: CatalogBucket
  terms: string[]
}

interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface SpotifyImage {
  url: string
}

interface SpotifyArtist {
  name: string
}

interface SpotifyAlbum {
  images: SpotifyImage[]
  release_date: string
}

interface SpotifyTrackItem {
  id: string
  name: string
  artists: SpotifyArtist[]
  album: SpotifyAlbum
  preview_url: string | null
  duration_ms: number
  popularity: number
  explicit: boolean
}

interface SpotifySearchTracksResponse {
  tracks: {
    items: SpotifyTrackItem[]
  }
}

interface SpotifyAudioFeaturesItem {
  id: string
  danceability: number | null
  energy: number | null
  valence: number | null
  tempo: number | null
}

interface SpotifyAudioFeaturesResponse {
  audio_features: SpotifyAudioFeaturesItem[]
}

interface SpotifyTokenCache {
  accessToken: string
  expiresAt: number
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

interface ItunesRssFeedResult {
  id: string
}

interface ItunesRssFeedResponse {
  feed?: {
    results?: ItunesRssFeedResult[]
  }
}

const SPOTIFY_BUCKET_QUERIES: SpotifyBucketQuery[] = [
  { bucket: "pop", query: "year:2023-2026 genre:pop" },
  { bucket: "pop", query: "year:1995-2026 genre:latin pop" },
  { bucket: "pop", query: "year:1995-2026 pop en espanol" },
  { bucket: "urbano", query: "year:2023-2026 genre:reggaeton" },
  { bucket: "urbano", query: "year:2023-2026 genre:trap latino" },
  { bucket: "urbano", query: "year:2015-2026 latin urbano" },
  { bucket: "rock", query: "year:1990-2026 genre:rock" },
  { bucket: "rock", query: "year:1985-2026 rock en espanol" },
  { bucket: "electronic", query: "year:2005-2026 genre:electronic" },
  { bucket: "indie_alt", query: "year:2000-2026 genre:indie" },
  { bucket: "indie_alt", query: "year:1990-2026 genre:alternative" },
  { bucket: "indie_alt", query: "year:1985-2026 alternativa y rock en espanol" },
  { bucket: "classics_70s_80s_90s", query: "year:1970-1999 genre:pop" },
  { bucket: "classics_00s_10s", query: "year:2000-2019 genre:pop" },
  { bucket: "cumbia_latina", query: "genre:cumbia" },
  { bucket: "cumbia_latina", query: "genre:latin" },
]

const ITUNES_BUCKET_QUERIES: ItunesBucketQuery[] = [
  {
    bucket: "classics_70s_80s_90s",
    terms: [
      "80s hits",
      "90s classics",
      "rock en espanol 90s",
      "nostalgia 90s",
      "baladas 90s",
      "disco 80s hits",
      "new wave 80s",
    ],
  },
  {
    bucket: "classics_00s_10s",
    terms: [
      "2000s pop hits",
      "2010s hits",
      "rock 2000s",
      "nostalgia 2000s",
      "pop 2000s",
      "indie 2010s",
      "electropop 2010s",
    ],
  },
  {
    bucket: "rock",
    terms: [
      "rock clasicos",
      "rock internacional hits",
      "rock nacional argentino",
      "rock en espanol",
      "alternativa y rock en espanol",
    ],
  },
  {
    bucket: "pop",
    terms: [
      "pop hits",
      "global pop hits",
      "argentina pop hits",
      "pop en espanol",
      "latin pop hits",
      "dance pop hits",
      "electropop hits",
    ],
  },
  {
    bucket: "cumbia_latina",
    terms: [
      "cumbia argentina",
      "cumbia villera",
      "latin cumbia hits",
      "cumbia santafesina",
      "cumbia sonidera",
    ],
  },
  {
    bucket: "urbano",
    terms: [
      "reggaeton hits",
      "trap latino hits",
      "urbano latino",
      "dembow hits",
      "latin trap",
    ],
  },
  {
    bucket: "electronic",
    terms: [
      "electronic dance hits",
      "edm classics",
      "house hits",
      "techno hits",
      "deep house",
      "drum and bass hits",
      "david guetta",
      "calvin harris",
      "avicii",
      "martin garrix",
      "swedish house mafia",
    ],
  },
  {
    bucket: "indie_alt",
    terms: [
      "indie hits",
      "alternative rock hits",
      "indie latino",
      "alternativa",
      "indie pop",
      "shoegaze hits",
      "post punk revival",
      "tame impala",
      "the strokes",
      "arctic monkeys",
      "cage the elephant",
    ],
  },
]

let tokenCache: SpotifyTokenCache | null = null

function pickPreferredTrack(current: Track, candidate: Track): Track {
  const currentPreviewScore = current.previewUrl ? 1 : 0
  const candidatePreviewScore = candidate.previewUrl ? 1 : 0
  if (candidatePreviewScore !== currentPreviewScore) {
    return candidatePreviewScore > currentPreviewScore ? candidate : current
  }

  const currentPopularity = current.spotifyPopularity ?? 0
  const candidatePopularity = candidate.spotifyPopularity ?? 0
  if (candidatePopularity !== currentPopularity) {
    return candidatePopularity > currentPopularity ? candidate : current
  }

  return current
}

function parseReleaseYear(releaseDate: string): number {
  const year = Number.parseInt(releaseDate.slice(0, 4), 10)
  if (Number.isNaN(year)) {
    return new Date().getFullYear()
  }

  return year
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return null
  }

  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  })

  if (!response.ok) {
    return null
  }

  const payload = (await response.json()) as SpotifyTokenResponse
  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Math.max(0, payload.expires_in - 30) * 1000,
  }

  return tokenCache.accessToken
}

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function isReasonableItunesMatch(
  candidate: ItunesTrackResult,
  trackName: string,
  artistName: string
): boolean {
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

export async function fetchItunesPreviewUrl(params: {
  trackName: string
  artistName: string
}): Promise<string | null> {
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
      (candidate) =>
        Boolean(candidate.previewUrl) &&
        isReasonableItunesMatch(candidate, params.trackName, params.artistName)
    )

    if (exactLike?.previewUrl) {
      return exactLike.previewUrl
    }

    return candidates.find((candidate) => Boolean(candidate.previewUrl))?.previewUrl ?? null
  } catch {
    return null
  }
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

function toHighResItunesArtwork(url?: string): string {
  if (!url) {
    return "/placeholder.jpg"
  }

  return url.replace(/\/\d+x\d+bb\./, "/600x600bb.")
}

function toItunesBattleTrack(item: ItunesTrackResult): Track | null {
  if (!item.trackId || !item.trackName || !item.artistName) {
    return null
  }

  const durationMs = typeof item.trackTimeMillis === "number" ? item.trackTimeMillis : 0

  return {
    id: `itunes_${item.trackId}`,
    spotifyTrackId: null,
    name: item.trackName,
    artist: item.artistName,
    albumImage: toHighResItunesArtwork(item.artworkUrl100),
    previewUrl: item.previewUrl ?? null,
    previewSource: item.previewUrl ? "itunes" : null,
    previewCheckedAt: new Date().toISOString(),
    spotifyPopularity: null,
    spotifyExplicit: null,
    spotifyPreviewAvailable: item.previewUrl ? true : false,
    eloScore: INITIAL_ELO_RATING,
    battlesCount: 0,
    bpm: 120,
    duration: formatDuration(durationMs),
    genre: item.primaryGenreName ?? "Unknown",
    year: parseItunesYear(item.releaseDate),
    energy: null,
    valence: null,
    danceability: null,
  }
}

function inferItunesBucket(trackName: string, artistName: string): CatalogBucket {
  const signal = normalizeForMatch(`${trackName} ${artistName}`)

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

  if (
    signal.includes("cumbia") ||
    signal.includes("villera") ||
    signal.includes("sonidera")
  ) {
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

  if (
    signal.includes("indie") ||
    signal.includes("alternative") ||
    signal.includes("shoegaze") ||
    signal.includes("post punk")
  ) {
    return "indie_alt"
  }

  if (
    signal.includes("rock") ||
    signal.includes("metal") ||
    signal.includes("punk") ||
    signal.includes("grunge")
  ) {
    return "rock"
  }

  return "pop"
}

function toItunesBattleTrackWithBucket(
  item: ItunesTrackResult,
  bucketOverride?: CatalogBucket
): Track | null {
  const mapped = toItunesBattleTrack(item)
  if (!mapped) {
    return null
  }

  return {
    ...mapped,
    catalogBucket: bucketOverride ?? inferItunesBucket(mapped.name, mapped.artist),
  }
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
          const mapped = toItunesBattleTrackWithBucket(item, bucketConfig.bucket)
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

          const mapped = toItunesBattleTrackWithBucket(item)
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

function roundTempoToBpm(tempo: number | null): number {
  if (typeof tempo !== "number" || Number.isNaN(tempo) || tempo <= 0) {
    return 120
  }

  return Math.round(tempo)
}

async function fetchAudioFeatures(
  accessToken: string,
  trackIds: string[]
): Promise<Map<string, SpotifyAudioFeaturesItem>> {
  if (trackIds.length === 0) {
    return new Map()
  }

  const chunkSize = 100
  const allFeatures = new Map<string, SpotifyAudioFeaturesItem>()

  for (let index = 0; index < trackIds.length; index += chunkSize) {
    const idsChunk = trackIds.slice(index, index + chunkSize)
    const url = `${SPOTIFY_API_URL}/audio-features?ids=${encodeURIComponent(idsChunk.join(","))}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      continue
    }

    const payload = (await response.json()) as SpotifyAudioFeaturesResponse
    for (const item of payload.audio_features ?? []) {
      if (item && typeof item.id === "string") {
        allFeatures.set(item.id, item)
      }
    }
  }

  return allFeatures
}

function toBattleTrack(
  track: SpotifyTrackItem,
  audioFeatures?: SpotifyAudioFeaturesItem,
  bucket: CatalogBucket = "pop"
): Track {
  const normalizedEnergy = audioFeatures?.energy ?? null
  const normalizedValence = audioFeatures?.valence ?? null
  const normalizedDanceability = audioFeatures?.danceability ?? null

  return {
    id: track.id,
    spotifyTrackId: track.id,
    catalogBucket: bucket,
    name: track.name,
    artist: track.artists.map((artist) => artist.name).join(", "),
    albumImage: track.album.images[0]?.url ?? "/placeholder.jpg",
    previewUrl: track.preview_url,
    spotifyPopularity: track.popularity,
    spotifyExplicit: track.explicit,
    spotifyPreviewAvailable: track.preview_url !== null,
    eloScore: INITIAL_ELO_RATING,
    battlesCount: 0,
    bpm: roundTempoToBpm(audioFeatures?.tempo ?? null),
    duration: formatDuration(track.duration_ms),
    genre: "Unknown",
    year: parseReleaseYear(track.album.release_date),
    energy: normalizedEnergy,
    valence: normalizedValence,
    danceability: normalizedDanceability,
  }
}

export async function fetchSpotifyBattleTracks(limit = 40): Promise<Track[]> {
  const accessToken = await getSpotifyAccessToken()
  if (!accessToken) {
    return []
  }

  const perQueryLimit = Math.max(8, Math.ceil(limit / SPOTIFY_BUCKET_QUERIES.length))

  try {
    const responses = await Promise.all(
      SPOTIFY_BUCKET_QUERIES.map(async ({ query, bucket }) => {
        const url = `${SPOTIFY_API_URL}/search?type=track&limit=${perQueryLimit}&market=${DEFAULT_MARKET}&q=${encodeURIComponent(query)}`
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        })

        if (!response.ok) {
          return [] as Array<{ item: SpotifyTrackItem; bucket: CatalogBucket }>
        }

        const payload = (await response.json()) as SpotifySearchTracksResponse
        return payload.tracks.items.map((item) => ({ item, bucket }))
      })
    )

    const dedupedByKey = new Map<string, Track>()

    for (const items of responses) {
      for (const { item, bucket } of items) {
        if (item.popularity < SPOTIFY_MIN_POPULARITY) {
          continue
        }

        const mapped = toBattleTrack(item, undefined, bucket)
        if (!isTrackAllowedByManualCuration(mapped)) {
          continue
        }

        const dedupeKey = buildTrackDuplicateKey(mapped)
        const current = dedupedByKey.get(dedupeKey)
        if (!current) {
          dedupedByKey.set(dedupeKey, mapped)
        } else {
          dedupedByKey.set(dedupeKey, pickPreferredTrack(current, mapped))
        }
      }
    }

    const dedupedTracks = Array.from(dedupedByKey.values())
    const spotifyTrackIds = dedupedTracks
      .map((track) => track.spotifyTrackId)
      .filter((id): id is string => typeof id === "string" && id.length > 0)

    const audioFeaturesByTrackId = await fetchAudioFeatures(accessToken, spotifyTrackIds)
    const hydrated = dedupedTracks.map((track) => {
      const spotifyTrackId = track.spotifyTrackId
      if (!spotifyTrackId) {
        return track
      }

      return {
        ...track,
        bpm: roundTempoToBpm(audioFeaturesByTrackId.get(spotifyTrackId)?.tempo ?? null),
        energy: audioFeaturesByTrackId.get(spotifyTrackId)?.energy ?? null,
        valence: audioFeaturesByTrackId.get(spotifyTrackId)?.valence ?? null,
        danceability: audioFeaturesByTrackId.get(spotifyTrackId)?.danceability ?? null,
      }
    })

    return hydrated.slice(0, limit)
  } catch {
    return []
  }
}
