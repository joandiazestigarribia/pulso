export interface Track {
  id: string
  name: string
  artist: string
  albumImage: string
  previewUrl: string | null
  eloScore: number
  battlesCount: number
  bpm: number
  duration: string
  genre: string
  year: number
}

export interface Battle {
  id: string
  trackA: Track
  trackB: Track
  winnerId: string | null
}

export const MOCK_TRACKS: Track[] = [
  {
    id: "1",
    name: "Midnight City",
    artist: "M83",
    albumImage: "/images/album-midnight-city.jpg",
    previewUrl: null,
    eloScore: 1520,
    battlesCount: 34,
    bpm: 105,
    duration: "04:03",
    genre: "Synthpop",
    year: 2011,
  },
  {
    id: "2",
    name: "Running Up That Hill",
    artist: "Kate Bush",
    albumImage: "/images/album-running-up.jpg",
    previewUrl: null,
    eloScore: 1510,
    battlesCount: 28,
    bpm: 103,
    duration: "04:56",
    genre: "Art Pop",
    year: 1985,
  },
  {
    id: "3",
    name: "One More Time",
    artist: "Daft Punk",
    albumImage: "/images/album-one-more-time.jpg",
    previewUrl: null,
    eloScore: 1550,
    battlesCount: 42,
    bpm: 122,
    duration: "05:20",
    genre: "French House",
    year: 2001,
  },
  {
    id: "4",
    name: "Blinding Lights",
    artist: "The Weeknd",
    albumImage: "/images/album-blinding-lights.jpg",
    previewUrl: null,
    eloScore: 1480,
    battlesCount: 38,
    bpm: 171,
    duration: "03:20",
    genre: "Synthwave",
    year: 2019,
  },
  {
    id: "5",
    name: "Smells Like Teen Spirit",
    artist: "Nirvana",
    albumImage: "/images/album-teen-spirit.jpg",
    previewUrl: null,
    eloScore: 1530,
    battlesCount: 45,
    bpm: 117,
    duration: "05:01",
    genre: "Grunge",
    year: 1991,
  },
  {
    id: "6",
    name: "Titi Me Pregunto",
    artist: "Bad Bunny",
    albumImage: "/images/album-titi.jpg",
    previewUrl: null,
    eloScore: 1490,
    battlesCount: 31,
    bpm: 130,
    duration: "04:03",
    genre: "Reggaeton",
    year: 2022,
  },
]

export function getRandomBattle(): Battle {
  const shuffled = [...MOCK_TRACKS].sort(() => Math.random() - 0.5)
  return {
    id: Math.random().toString(36).substring(7),
    trackA: shuffled[0],
    trackB: shuffled[1],
    winnerId: null,
  }
}

export function calculateElo(
  winnerElo: number,
  loserElo: number,
  K = 32
): { newWinnerElo: number; newLoserElo: number } {
  const expectedScore = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400))
  const newWinnerElo = Math.round(winnerElo + K * (1 - expectedScore))
  const newLoserElo = Math.round(loserElo + K * (0 - (1 - expectedScore)))
  return { newWinnerElo, newLoserElo }
}
