export type BattleState = "PENDING" | "COMPLETED"

export interface Track {
  id: string
  catalogBucket?: string
  name: string
  artist: string
  albumImage: string
  previewUrl: string | null
  previewSource?: string | null
  previewCheckedAt?: string | null
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
    catalogBucket: "classics_00s_10s",
    name: "Midnight City",
    artist: "M83",
    albumImage: "/images/album-midnight-city.jpg",
    previewUrl: null,
    previewSource: null,
    previewCheckedAt: null,
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
    catalogBucket: "classics_70s_80s_90s",
    name: "Running Up That Hill",
    artist: "Kate Bush",
    albumImage: "/images/album-running-up.jpg",
    previewUrl: null,
    previewSource: null,
    previewCheckedAt: null,
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
    catalogBucket: "electronic",
    name: "One More Time",
    artist: "Daft Punk",
    albumImage: "/images/album-one-more-time.jpg",
    previewUrl: null,
    previewSource: null,
    previewCheckedAt: null,
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
    catalogBucket: "pop",
    name: "Blinding Lights",
    artist: "The Weeknd",
    albumImage: "/images/album-blinding-lights.jpg",
    previewUrl: null,
    previewSource: null,
    previewCheckedAt: null,
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
    catalogBucket: "rock",
    name: "Smells Like Teen Spirit",
    artist: "Nirvana",
    albumImage: "/images/album-teen-spirit.jpg",
    previewUrl: null,
    previewSource: null,
    previewCheckedAt: null,
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
    catalogBucket: "urbano",
    name: "Titi Me Pregunto",
    artist: "Bad Bunny",
    albumImage: "/images/album-titi.jpg",
    previewUrl: null,
    previewSource: null,
    previewCheckedAt: null,
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
