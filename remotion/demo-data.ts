export type DemoFormat = "horizontal" | "vertical"

export interface DemoTrack {
  label: string
  title: string
  artist: string
  albumImage: string
  genre: string
  year: string
  elo: number
  accent: string
}

export interface DemoMetric {
  label: string
  value: number
  accent: string
}

export const demoTracks: [DemoTrack, DemoTrack] = [
  {
    label: "Canci\u00f3n A",
    title: "Midnight City",
    artist: "M83",
    albumImage: "images/album-midnight-city.jpg",
    genre: "Synthpop",
    year: "2011",
    elo: 1520,
    accent: "#7be3ff",
  },
  {
    label: "Canci\u00f3n B",
    title: "Tit\u00ed Me Pregunt\u00f3",
    artist: "Bad Bunny",
    albumImage: "images/album-titi.jpg",
    genre: "Reggaeton",
    year: "2022",
    elo: 1490,
    accent: "#ffb5fb",
  },
]

export const demoMetrics: DemoMetric[] = [
  { label: "Intensidad sonora", value: 76, accent: "#ffe600" },
  { label: "Pulso r\u00edtmico", value: 82, accent: "#ff43f8" },
  { label: "Tendencia al baile", value: 79, accent: "#ffe98f" },
  { label: "Exploraci\u00f3n de g\u00e9neros", value: 64, accent: "#00ff66" },
]

export const profileGenres = ["Pop", "Urbano", "Synthpop"]
