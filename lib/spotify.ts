import type { Track } from "@/lib/mock-data"
import { INITIAL_ELO_RATING } from "@/lib/elo"

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
const SPOTIFY_API_URL = "https://api.spotify.com/v1"
const DEFAULT_MARKET = "US"

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
}

interface SpotifySearchTracksResponse {
  tracks: {
    items: SpotifyTrackItem[]
  }
}

interface SpotifyTokenCache {
  accessToken: string
  expiresAt: number
}

let tokenCache: SpotifyTokenCache | null = null

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

function toBattleTrack(track: SpotifyTrackItem): Track {
  return {
    id: track.id,
    name: track.name,
    artist: track.artists.map((artist) => artist.name).join(", "),
    albumImage: track.album.images[0]?.url ?? "/placeholder.jpg",
    previewUrl: track.preview_url,
    eloScore: INITIAL_ELO_RATING,
    battlesCount: 0,
    bpm: 120,
    duration: formatDuration(track.duration_ms),
    genre: "Unknown",
    year: parseReleaseYear(track.album.release_date),
  }
}

export async function fetchSpotifyBattleTracks(limit = 40): Promise<Track[]> {
  const accessToken = await getSpotifyAccessToken()
  if (!accessToken) {
    return []
  }

  const queries = ["genre:pop", "genre:rock", "genre:electronic", "genre:hip-hop"]
  const perQueryLimit = Math.max(8, Math.ceil(limit / queries.length))

  try {
    const responses = await Promise.all(
      queries.map(async (query) => {
        const url = `${SPOTIFY_API_URL}/search?type=track&limit=${perQueryLimit}&market=${DEFAULT_MARKET}&q=${encodeURIComponent(query)}`
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        })

        if (!response.ok) {
          return [] as SpotifyTrackItem[]
        }

        const payload = (await response.json()) as SpotifySearchTracksResponse
        return payload.tracks.items
      })
    )

    const deduped = new Map<string, Track>()
    for (const items of responses) {
      for (const item of items) {
        if (!deduped.has(item.id)) {
          deduped.set(item.id, toBattleTrack(item))
        }
      }
    }

    return Array.from(deduped.values()).slice(0, limit)
  } catch {
    return []
  }
}
