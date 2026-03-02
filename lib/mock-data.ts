export type BattleState = "PENDING" | "COMPLETED"

export interface Track {
  id: string
  spotifyTrackId?: string | null
  catalogBucket?: string
  name: string
  artist: string
  albumImage: string
  previewUrl: string | null
  previewSource?: string | null
  previewCheckedAt?: string | null
  spotifyPopularity?: number | null
  spotifyExplicit?: boolean | null
  spotifyPreviewAvailable?: boolean | null
  eloScore: number
  battlesCount: number
  bpm: number
  duration: string
  genre: string
  year: number
  energy?: number | null
  valence?: number | null
  danceability?: number | null
}

export interface Battle {
  id: string
  trackA: Track
  trackB: Track
  userId: string
  status: BattleState
  winnerId: string | null
  createdAt: string
  completedAt: string | null
}

export const MOCK_TRACKS: Track[] = [
  {
    id: "1",
    spotifyTrackId: null,
    catalogBucket: "classics_00s_10s",
    name: "Midnight City",
    artist: "M83",
    albumImage: "/images/album-midnight-city.jpg",
    previewUrl: null,
    previewSource: null,
    previewCheckedAt: null,
    spotifyPopularity: 79,
    spotifyExplicit: false,
    spotifyPreviewAvailable: false,
    eloScore: 1520,
    battlesCount: 34,
    bpm: 105,
    duration: "04:03",
    genre: "Synthpop",
    year: 2011,
    energy: 0.72,
    valence: 0.53,
    danceability: 0.67,
  },
  {
    id: "2",
    spotifyTrackId: null,
    catalogBucket: "classics_70s_80s_90s",
    name: "Running Up That Hill",
    artist: "Kate Bush",
    albumImage: "/images/album-running-up.jpg",
    previewUrl: null,
    previewSource: null,
    previewCheckedAt: null,
    spotifyPopularity: 83,
    spotifyExplicit: false,
    spotifyPreviewAvailable: false,
    eloScore: 1510,
    battlesCount: 28,
    bpm: 103,
    duration: "04:56",
    genre: "Art Pop",
    year: 1985,
    energy: 0.64,
    valence: 0.38,
    danceability: 0.58,
  },
  {
    id: "3",
    spotifyTrackId: null,
    catalogBucket: "electronic",
    name: "One More Time",
    artist: "Daft Punk",
    albumImage: "/images/album-one-more-time.jpg",
    previewUrl: null,
    previewSource: null,
    previewCheckedAt: null,
    spotifyPopularity: 80,
    spotifyExplicit: false,
    spotifyPreviewAvailable: false,
    eloScore: 1550,
    battlesCount: 42,
    bpm: 122,
    duration: "05:20",
    genre: "French House",
    year: 2001,
    energy: 0.83,
    valence: 0.71,
    danceability: 0.8,
  },
  {
    id: "4",
    spotifyTrackId: null,
    catalogBucket: "pop",
    name: "Blinding Lights",
    artist: "The Weeknd",
    albumImage: "/images/album-blinding-lights.jpg",
    previewUrl: null,
    previewSource: null,
    previewCheckedAt: null,
    spotifyPopularity: 92,
    spotifyExplicit: false,
    spotifyPreviewAvailable: false,
    eloScore: 1480,
    battlesCount: 38,
    bpm: 171,
    duration: "03:20",
    genre: "Synthwave",
    year: 2019,
    energy: 0.73,
    valence: 0.34,
    danceability: 0.51,
  },
  {
    id: "5",
    spotifyTrackId: null,
    catalogBucket: "rock",
    name: "Smells Like Teen Spirit",
    artist: "Nirvana",
    albumImage: "/images/album-teen-spirit.jpg",
    previewUrl: null,
    previewSource: null,
    previewCheckedAt: null,
    spotifyPopularity: 84,
    spotifyExplicit: true,
    spotifyPreviewAvailable: false,
    eloScore: 1530,
    battlesCount: 45,
    bpm: 117,
    duration: "05:01",
    genre: "Grunge",
    year: 1991,
    energy: 0.91,
    valence: 0.43,
    danceability: 0.5,
  },
  {
    id: "6",
    spotifyTrackId: null,
    catalogBucket: "urbano",
    name: "Titi Me Pregunto",
    artist: "Bad Bunny",
    albumImage: "/images/album-titi.jpg",
    previewUrl: null,
    previewSource: null,
    previewCheckedAt: null,
    spotifyPopularity: 88,
    spotifyExplicit: true,
    spotifyPreviewAvailable: false,
    eloScore: 1490,
    battlesCount: 31,
    bpm: 130,
    duration: "04:03",
    genre: "Reggaeton",
    year: 2022,
    energy: 0.72,
    valence: 0.66,
    danceability: 0.81,
  },
]
