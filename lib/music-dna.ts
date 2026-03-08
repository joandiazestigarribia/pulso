export interface IdentitySessionResponse {
  isAuthenticated: boolean
  userId: string | null
  anonymousId: string | null
  spotifyConnected: boolean
  spotifyTokenError: string | null
}

export interface FullProfileData {
  unlockThreshold: number
  completedBattlesCount: number
  unlocked: boolean
  profile: {
    summary: string | null
    dominantGenre: string | null
    genreVarietyScore: number
    averageEnergy: number | null
    averageValence: number | null
    averageDanceability: number | null
    decadeDistribution: Record<string, number>
    generatedFromVotes: number
    updatedAt: string
  } | null
  teaser: {
    hint: string
    remainingBattles: number
    topGenres: Array<{ genre: string; count: number }>
    topSubgenres: Array<{ genre: string; count: number }>
  }
  error: {
    code: "PROFILE_GENERATION_FAILED"
    message: string
  } | null
}

export interface FullProfileResponse {
  ok: boolean
  code?: string
  message?: string
  data?: FullProfileData
}

export interface RadarAxis {
  key: string
  label: string
  value: number
}

export interface SonicPersona {
  id: string
  name: string
  handleBase: string
  codename: string
  assetFile: string
}

const sonicPersonas: Record<string, SonicPersona> = {
  chill_oracle: {
    id: "chill_oracle",
    name: "Oraculo Chill",
    handleBase: "oraculo_chill",
    codename: "SO-01",
    assetFile: "chill_oracle_character_asset resize.png",
  },
  hyperpop_pilot: {
    id: "hyperpop_pilot",
    name: "Piloto Hyperpop",
    handleBase: "piloto_hyperpop",
    codename: "SO-02",
    assetFile: "hyperpop_pilot_character_asset resize.png",
  },
  lo_fi_alchemist: {
    id: "lo_fi_alchemist",
    name: "Alquimista Lo-Fi",
    handleBase: "alquimista_lofi",
    codename: "SO-03",
    assetFile: "lo_fi_alchemist_character_asset resize.png",
  },
  neon_nomad: {
    id: "neon_nomad",
    name: "Nomada Neon",
    handleBase: "nomada_neon",
    codename: "SO-04",
    assetFile: "neon_nomad_character_asset resize.png",
  },
  ranger: {
    id: "ranger",
    name: "Explorador Ranger",
    handleBase: "sonic_ranger",
    codename: "SO-05",
    assetFile: "ranger_character_asset resize.png",
  },
  retro_scout: {
    id: "retro_scout",
    name: "Scout Retro",
    handleBase: "scout_retro",
    codename: "SO-06",
    assetFile: "retro_scout_character_asset resize.png",
  },
  synth_captain: {
    id: "synth_captain",
    name: "Capitan Synth",
    handleBase: "capitan_synth",
    codename: "SO-07",
    assetFile: "synth_captain_character_asset resize.png",
  },
  vaporwave_druid: {
    id: "vaporwave_druid",
    name: "Druida Vaporwave",
    handleBase: "druida_vaporwave",
    codename: "SO-08",
    assetFile: "vaporwave_druid_character_asset resize.png",
  },
}

export function fetcher<T>(url: string): Promise<T> {
  return fetch(url).then((response) => response.json() as Promise<T>)
}

export function toUnit(value: number | null): number {
  if (value === null || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0.5
  }

  return Math.max(0, Math.min(1, value))
}

export function toPercent(value: number): number {
  return Math.round(value * 100)
}

function hasGenreSignal(genreValues: string[], signals: string[]): boolean {
  const normalized = genreValues.map((value) => value.toLowerCase())
  return signals.some((signal) => normalized.some((genre) => genre.includes(signal)))
}

export function getDominantGenres(profileState: FullProfileData | undefined): string[] {
  const baseGenres = profileState?.teaser.topGenres ?? []
  const subGenres = profileState?.teaser.topSubgenres ?? []
  const labels = [...baseGenres, ...subGenres].map((item) => item.genre).filter(Boolean)
  const selected: string[] = []

  for (const label of labels) {
    if (isRedundantGenreLabel(label, selected)) {
      continue
    }

    selected.push(label)
    if (selected.length >= 5) {
      break
    }
  }

  return selected
}

export function resolveSonicPersona(profileState: FullProfileData | undefined, genreValues: string[]): SonicPersona {
  const profile = profileState?.profile
  const energy = toUnit(profile?.averageEnergy ?? null)
  const danceability = toUnit(profile?.averageDanceability ?? null)
  const valence = toUnit(profile?.averageValence ?? null)
  const variety = Math.max(0, Math.min(1, profile?.genreVarietyScore ?? 0.5))
  const topDecade = Object.entries(profile?.decadeDistribution ?? {})[0]?.[0]?.toLowerCase() ?? ""

  if (danceability >= 0.72 && energy >= 0.68) {
    return sonicPersonas.hyperpop_pilot
  }
  if (variety >= 0.75) {
    return sonicPersonas.neon_nomad
  }
  if (energy <= 0.43 && valence <= 0.58) {
    return sonicPersonas.lo_fi_alchemist
  }
  if (valence >= 0.7 && energy <= 0.62) {
    return sonicPersonas.chill_oracle
  }
  if (topDecade.includes("70") || topDecade.includes("80") || topDecade.includes("90")) {
    return sonicPersonas.retro_scout
  }
  if (hasGenreSignal(genreValues, ["synth", "electro", "electronic", "house", "edm", "techno"])) {
    return sonicPersonas.synth_captain
  }
  if (hasGenreSignal(genreValues, ["dream", "ambient", "shoegaze", "indie"])) {
    return sonicPersonas.vaporwave_druid
  }

  return sonicPersonas.ranger
}

function levelBand(value: number | null): "baja" | "media" | "alta" {
  if (value === null || !Number.isFinite(value)) {
    return "media"
  }
  if (value < 0.4) {
    return "baja"
  }
  if (value > 0.65) {
    return "alta"
  }
  return "media"
}

export function resolveDynamicPersonaDescription(
  persona: SonicPersona,
  profileState: FullProfileData | undefined,
  dominantGenres: string[]
): string {
  const profile = profileState?.profile
  const mainGenre = dominantGenres[0] ?? profile?.dominantGenre ?? "generos mixtos"
  const secondGenre = dominantGenres[1] ?? "senales variadas"
  const topDecade = Object.entries(profile?.decadeDistribution ?? {})[0]?.[0] ?? "decadas mixtas"
  const energy = levelBand(profile?.averageEnergy ?? null)
  const dance = levelBand(profile?.averageDanceability ?? null)
  const mood = levelBand(profile?.averageValence ?? null)

  return `${persona.name}: combinás ${mainGenre} con ${secondGenre} como si fueras DJ residente de tu propio festival. Tu estilo cae en energia ${energy}, animo ${mood} y bailabilidad ${dance}, con un guiño fuerte a ${topDecade}; en resumen, criterio fino y cero playlists aburridas.`
}

export function buildDynamicHandle(base: string, userId: string | null, anonymousId: string | null): string {
  const identity = userId ?? anonymousId ?? "guest"
  const suffix = identity.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toLowerCase() || "0000"
  return `@${base}_${suffix}`
}

export function buildDynamicCode(baseCode: string, profileState: FullProfileData | undefined): string {
  const battles = profileState?.completedBattlesCount ?? 0
  const variety = Math.round((profileState?.profile?.genreVarietyScore ?? 0) * 100)
  return `${baseCode}-${String(Math.min(999, battles)).padStart(3, "0")}-${String(variety).padStart(2, "0")}`
}

export function formatMetricPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "N/D"
  }
  return `${toPercent(value)}%`
}

export function getRadarAxes(profile: FullProfileData["profile"]): RadarAxis[] {
  const energy = toUnit(profile?.averageEnergy ?? null)
  const dance = toUnit(profile?.averageDanceability ?? null)
  const valence = toUnit(profile?.averageValence ?? null)
  const variety = Math.max(0, Math.min(1, profile?.genreVarietyScore ?? 0.5))
  const topDecade = Object.keys(profile?.decadeDistribution ?? {})[0] ?? ""
  const nostalgia = getNostalgiaScore(topDecade)
  const rhythm = Math.max(0, Math.min(1, dance * 0.62 + energy * 0.38))

  return [
    { key: "energy", label: "Intensidad", value: energy },
    { key: "bpm", label: "Ritmo", value: rhythm },
    { key: "dance", label: "Baile", value: dance },
    { key: "nostalgia", label: "Nostalgia", value: nostalgia },
    { key: "valence", label: "Animo", value: valence },
    { key: "obscurity", label: "Exploracion", value: variety },
  ]
}

export function polarPoint(index: number, total: number, radius: number, center: number): { x: number; y: number } {
  const angle = ((Math.PI * 2) / total) * index - Math.PI / 2
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  }
}

export function buildRadarPolygon(axes: RadarAxis[], radius: number, center: number): string {
  return axes
    .map((axis, index) => {
      const point = polarPoint(index, axes.length, radius * axis.value, center)
      return `${point.x},${point.y}`
    })
    .join(" ")
}

export function buildRadarPath(axes: RadarAxis[], radius: number, center: number): string {
  return (
    axes
      .map((axis, index) => {
        const point = polarPoint(index, axes.length, radius * axis.value, center)
        return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
      })
      .join(" ") + " Z"
  )
}

function normalizeGenreText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/urban/g, "urbano")
    .replace(/&/g, " ")
    .replace(/[^\w\s/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function genreTokenSet(value: string): Set<string> {
  const normalized = normalizeGenreText(value).replace(/\//g, " ")
  const tokens = normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && token !== "music" && token !== "genre")
  return new Set(tokens)
}

function isSubset(left: Set<string>, right: Set<string>): boolean {
  if (left.size === 0 || right.size === 0 || left.size > right.size) {
    return false
  }

  for (const token of left) {
    if (!right.has(token)) {
      return false
    }
  }

  return true
}

function isRedundantGenreLabel(candidate: string, selected: string[]): boolean {
  const candidateNormalized = normalizeGenreText(candidate)
  const candidateTokens = genreTokenSet(candidate)

  for (const existing of selected) {
    const existingNormalized = normalizeGenreText(existing)
    if (candidateNormalized === existingNormalized) {
      return true
    }

    const existingTokens = genreTokenSet(existing)
    if (isSubset(candidateTokens, existingTokens) || isSubset(existingTokens, candidateTokens)) {
      return true
    }
  }

  return false
}

function getNostalgiaScore(decadeLabel: string): number {
  const match = decadeLabel.match(/(\d{4})/)
  if (!match) {
    return 0.5
  }

  const decade = Number.parseInt(match[1] ?? "", 10)
  if (!Number.isFinite(decade) || decade < 1950) {
    return 0.5
  }

  const nowYear = 2026
  const age = Math.max(0, nowYear - decade)
  return Math.max(0, Math.min(1, age / 70))
}
