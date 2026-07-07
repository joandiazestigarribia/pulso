export interface IdentitySessionResponse {
  isAuthenticated: boolean
  userId: string | null
  anonymousId: string | null
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
    averageEnergy: number | null
    averageValence: number | null
    averageDanceability: number | null
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
  macroId?: "ranger" | "hyperpop" | "neon"
  subprofileId?: string
}

const personaDisplayNameByToken: Record<string, string> = {
  chill: "Oráculo Chill",
  oracle: "Oráculo Chill",
  lofi: "Alquimista Lo-Fi",
  "lo-fi": "Alquimista Lo-Fi",
  alchemist: "Alquimista Lo-Fi",
  synth: "Capitán Synth",
  captain: "Capitán Synth",
  vapor: "Druida Vaporwave",
  vaporwave: "Druida Vaporwave",
  retro: "Scout Retro",
  ranger: "Explorador Ranger",
  hyperpop: "Piloto Hyperpop",
  piloto: "Piloto Hyperpop",
  nomada: "Nómada Neón",
  neon: "Nómada Neón",
  metal: "Berserker Metal",
  berserker: "Berserker Metal",
  jester: "Jester Groove",
  paladin: "Pop Paladin",
  color: "Pop Color Rebel",
}

const sonicPersonas: Record<string, SonicPersona> = {
  chill_oracle: {
    id: "chill_oracle",
    name: "Oráculo Chill",
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
    name: "Nómada Neón",
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
    name: "Capitán Synth",
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
  metal_berserker: {
    id: "metal_berserker",
    name: "Berserker Metal",
    handleBase: "berserker_metal",
    codename: "SO-09",
    assetFile: "metal_character.png",
  },
  jester_groove: {
    id: "jester_groove",
    name: "Jester Groove",
    handleBase: "jester_groove",
    codename: "SO-10",
    assetFile: "jester_character.png",
  },
  pop_paladin: {
    id: "pop_paladin",
    name: "Pop Paladin",
    handleBase: "pop_paladin",
    codename: "SO-11",
    assetFile: "pop_paladin_character.png",
  },
  pop_color_rebel: {
    id: "pop_color_rebel",
    name: "Pop Color Rebel",
    handleBase: "pop_color_rebel",
    codename: "SO-12",
    assetFile: "pop_color_character.png",
  },
}

export type PersonaTone = "low" | "medium" | "high"
export type HeadlineStyle = "totem" | "signal"
export type DecadeGroup = "classic" | "retro" | "millennial" | "current"

interface PersonaCopyCatalogEntry {
  archetypeLabel: string
  toneCopy: Record<PersonaTone, string>
  templates: [string, string, string, string]
}

export interface PersonaShareCopyResult {
  headline: string
  description: string
  meta: {
    archetype: string
    tone: PersonaTone
    templateIndex: number
    headlineStyle: HeadlineStyle
    decadeGroup: DecadeGroup
    seed: number
  }
}

export const personaCopyCatalog = {
  chill_oracle: {
    archetypeLabel: "Calma Magnética",
    toneCopy: {
      low: "fluís en modo brisa, sin ruido extra",
      medium: "equilibrás calma y empuje con precisión",
      high: "levantás la energía sin perder elegancia",
    },
    templates: [
      "Tu mapa mezcla {genre} con una lectura fina del ritmo. {toneCopy}.",
      "Tu criterio en {genre} suena limpio y directo. {toneCopy}.",
      "Cuando elegís, {genre} gana por textura y detalle. {toneCopy}.",
      "Tu Perfil Sonoro ordena {genre} con pulso estable y curaduría clara. {toneCopy}.",
    ],
  },
  hyperpop_pilot: {
    archetypeLabel: "Impulso Neón",
    toneCopy: {
      low: "administras la tension para que cada golpe importe",
      medium: "sostenés aceleración constante con control",
      high: "vas al frente con picos brillantes y precisos",
    },
    templates: [
      "Tu radar prioriza {genre} con decisión quirúrgica. {toneCopy}.",
      "Lees {genre} como una pista de lanzamiento. {toneCopy}.",
      "En tus votos, {genre} entra con timing agresivo. {toneCopy}.",
      "Tu selección convierte {genre} en una carrera bien medida. {toneCopy}.",
    ],
  },
  lo_fi_alchemist: {
    archetypeLabel: "Laboratorio Nocturno",
    toneCopy: {
      low: "preferís capas suaves que dejan espacio al detalle",
      medium: "combinas intimidad y groove en dosis exacta",
      high: "subís intensidad sin perder atmósfera",
    },
    templates: [
      "Tu fórmula cruza {genre} con enfoque artesanal. {toneCopy}.",
      "Tu perfil en {genre} favorece texturas sobre exceso. {toneCopy}.",
      "Cada voto refina {genre} con mirada de estudio. {toneCopy}.",
      "Tu escucha empuja {genre} hacia un balance fino. {toneCopy}.",
    ],
  },
  neon_nomad: {
    archetypeLabel: "Ruta Hibrida",
    toneCopy: {
      low: "explorás con pausa y criterio abierto",
      medium: "saltás entre climas sin romper continuidad",
      high: "encadenas contrastes con hambre de descubrimiento",
    },
    templates: [
      "Tu Perfil Sonoro conecta {genre} con rutas poco obvias. {toneCopy}.",
      "Tu perfil convierte {genre} en territorio de cruce. {toneCopy}.",
      "Tus elecciones leen {genre} como mapa expandible. {toneCopy}.",
      "Hay firma viajera en como ordenas {genre}. {toneCopy}.",
    ],
  },
  ranger: {
    archetypeLabel: "Brigada Central",
    toneCopy: {
      low: "mantenés el foco en decisiones consistentes",
      medium: "equilibrás impacto y claridad en cada versus",
      high: "aceleras el pulso sin salirte del plan",
    },
    templates: [
      "Tu perfil sostiene {genre} con criterio competitivo. {toneCopy}.",
      "Tu curaduría de {genre} muestra disciplina y buena lectura. {toneCopy}.",
      "En batalla, elegís {genre} con enfoque estratégico. {toneCopy}.",
      "Tu Perfil Sonoro deja una firma estable en torno a {genre}. {toneCopy}.",
    ],
  },
  retro_scout: {
    archetypeLabel: "Archivo Analógico",
    toneCopy: {
      low: "priorizas cadencia y memoria antes que volumen",
      medium: "mezclas tradicion y actualidad con soltura",
      high: "reactivás clásicos con energía renovada",
    },
    templates: [
      "Tu estilo lleva {genre} con mirada histórica. {toneCopy}.",
      "Tu selección rescata {genre} con sensibilidad de archivo. {toneCopy}.",
      "En tus votos, {genre} conserva raiz y direccion. {toneCopy}.",
      "Tu Perfil Sonoro convierte {genre} en puente entre épocas. {toneCopy}.",
    ],
  },
  synth_captain: {
    archetypeLabel: "Comando Eléctrico",
    toneCopy: {
      low: "preferís pulsos controlados y líneas limpias",
      medium: "mantenés groove firme con enfoque técnico",
      high: "enciendes la pista con traccion sostenida",
    },
    templates: [
      "Tu firma empuja {genre} con precisión mecánica. {toneCopy}.",
      "Tu lectura de {genre} prioriza arquitectura sonora. {toneCopy}.",
      "Cada decisión en {genre} suena calibrada para movimiento. {toneCopy}.",
      "Tu Perfil Sonoro electrifica {genre} sin perder estructura. {toneCopy}.",
    ],
  },
  vaporwave_druid: {
    archetypeLabel: "Mirador Onírico",
    toneCopy: {
      low: "sostenés un clima introspectivo y envolvente",
      medium: "combinas color emocional con paso firme",
      high: "amplificas la vibra sin romper el hechizo",
    },
    templates: [
      "Tu perfil modela {genre} desde la atmósfera. {toneCopy}.",
      "Tu selección en {genre} prioriza paisaje y sensación. {toneCopy}.",
      "En cada versus, {genre} aparece con narrativa visual. {toneCopy}.",
      "Tu Perfil Sonoro orienta {genre} hacia un viaje inmersivo. {toneCopy}.",
    ],
  },
  metal_berserker: {
    archetypeLabel: "Martillo de Acero",
    toneCopy: {
      low: "mantenés peso y tensión con control quirúrgico",
      medium: "sostenés potencia firme sin perder pegada",
      high: "descargas rafagas intensas con autoridad total",
    },
    templates: [
      "Tu perfil levanta {genre} con potencia frontal. {toneCopy}.",
      "Tu radar en {genre} prioriza ataque, riff y presencia. {toneCopy}.",
      "En tus versus, {genre} entra con filo y decisión. {toneCopy}.",
      "Tu Perfil Sonoro consolida {genre} en modo combate. {toneCopy}.",
    ],
  },
  jester_groove: {
    archetypeLabel: "Escena Teatral",
    toneCopy: {
      low: "dosificas color y ritmo con elegancia juguetona",
      medium: "mezclas teatralidad y groove con timing preciso",
      high: "enciendes el show con carisma y dinamica expansiva",
    },
    templates: [
      "Tu lectura de {genre} suena performatica y expresiva. {toneCopy}.",
      "En tu selección, {genre} gana por gesto y dinámica. {toneCopy}.",
      "Tu perfil convierte {genre} en acto escenico con pulso. {toneCopy}.",
      "Tu Perfil Sonoro lleva {genre} a una narrativa de escenario. {toneCopy}.",
    ],
  },
  pop_paladin: {
    archetypeLabel: "Estandarte Pop",
    toneCopy: {
      low: "sostenés brillo con estructura clara",
      medium: "equilibrás himno y groove con seguridad",
      high: "proyectás energía alta con precisión coreable",
    },
    templates: [
      "Tu criterio impulsa {genre} en clave de himno. {toneCopy}.",
      "Tu perfil en {genre} prioriza hooks y elevacion. {toneCopy}.",
      "En batalla, {genre} aparece con foco luminoso. {toneCopy}.",
      "Tu Perfil Sonoro ordena {genre} para impactar y quedarse. {toneCopy}.",
    ],
  },
  pop_color_rebel: {
    archetypeLabel: "Prisma Festivo",
    toneCopy: {
      low: "administras contraste pop con pulso relajado",
      medium: "combinas color, ritmo y sorpresa sin friccion",
      high: "lanzás explosiones pop con energía de festival",
    },
    templates: [
      "Tu mapa mezcla {genre} con cromatica vibrante. {toneCopy}.",
      "Tu selección vuelve {genre} más audaz y bailable. {toneCopy}.",
      "En tus votos, {genre} aparece con brillo expansivo. {toneCopy}.",
      "Tu Perfil Sonoro traduce {genre} en una paleta de alto impacto. {toneCopy}.",
    ],
  },
} as const satisfies Record<string, PersonaCopyCatalogEntry>

type PersonaArchetype = keyof typeof personaCopyCatalog
type MacroPersona = "ranger" | "hyperpop" | "neon"

function isPersonaArchetype(value: string): value is PersonaArchetype {
  return value in personaCopyCatalog
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

function normalizedEntropy(counts: number[]): number {
  const validCounts = counts.filter((count) => Number.isFinite(count) && count > 0)
  const total = validCounts.reduce((sum, count) => sum + count, 0)
  if (total <= 0 || validCounts.length <= 1) {
    return 0.5
  }

  let entropy = 0
  for (const count of validCounts) {
    const probability = count / total
    entropy -= probability * Math.log2(probability)
  }

  const maxEntropy = Math.log2(validCounts.length)
  if (maxEntropy <= 0) {
    return 0.5
  }

  return Math.max(0, Math.min(1, entropy / maxEntropy))
}

function teaserVarietyScore(profileState: FullProfileData | undefined): number {
  return normalizedEntropy((profileState?.teaser.topGenres ?? []).map((entry) => entry.count))
}

interface InferredFeatureSnapshot {
  energy: number
  valence: number
  danceability: number
}

interface GenreFeatureAnchor {
  signals: string[]
  energy: number
  valence: number
  danceability: number
}

const genreFeatureAnchors: GenreFeatureAnchor[] = [
  { signals: ["hip hop", "rap", "trap", "drill", "reggaeton", "urbano"], energy: 0.74, valence: 0.58, danceability: 0.82 },
  { signals: ["electronic", "edm", "house", "techno", "dance"], energy: 0.79, valence: 0.6, danceability: 0.86 },
  { signals: ["pop", "synthpop"], energy: 0.67, valence: 0.7, danceability: 0.74 },
  { signals: ["rock", "metal", "punk", "hard rock"], energy: 0.75, valence: 0.48, danceability: 0.47 },
  { signals: ["indie", "shoegaze", "dream pop", "ambient", "lo fi"], energy: 0.42, valence: 0.56, danceability: 0.44 },
  { signals: ["rnb", "soul", "funk"], energy: 0.63, valence: 0.62, danceability: 0.72 },
  { signals: ["folk", "acoustic", "regional"], energy: 0.46, valence: 0.54, danceability: 0.43 },
]

function toUnitOrNull(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) {
    return null
  }

  return Math.max(0, Math.min(1, value))
}

function resolveMetricValue(
  primary: number | null | undefined,
  secondary: number | null | undefined,
  inferred: number | null | undefined
): number | null {
  return toUnitOrNull(primary) ?? toUnitOrNull(secondary) ?? toUnitOrNull(inferred)
}

function inferFeaturesFromGenreSignals(profileState: FullProfileData | undefined): InferredFeatureSnapshot | null {
  const weightedEntries = [
    ...(profileState?.teaser.topGenres ?? []).map((entry) => ({ genre: entry.genre, weight: entry.count })),
    ...(profileState?.teaser.topSubgenres ?? []).map((entry) => ({ genre: entry.genre, weight: Math.max(1, entry.count * 0.7) })),
  ]

  if (weightedEntries.length === 0) {
    return null
  }

  let totalWeight = 0
  let energy = 0
  let valence = 0
  let danceability = 0

  for (const entry of weightedEntries) {
    const normalizedGenre = normalizeGenreText(entry.genre)
    const anchor = genreFeatureAnchors.find((candidate) =>
      candidate.signals.some((signal) => normalizedGenre.includes(normalizeGenreText(signal)))
    )

    if (!anchor) {
      continue
    }

    totalWeight += entry.weight
    energy += anchor.energy * entry.weight
    valence += anchor.valence * entry.weight
    danceability += anchor.danceability * entry.weight
  }

  if (totalWeight <= 0) {
    return null
  }

  return {
    energy: Math.max(0, Math.min(1, energy / totalWeight)),
    valence: Math.max(0, Math.min(1, valence / totalWeight)),
    danceability: Math.max(0, Math.min(1, danceability / totalWeight)),
  }
}

function getTopGenreShare(profileState: FullProfileData | undefined): number {
  const counts = (profileState?.teaser.topGenres ?? []).map((entry) => entry.count).filter((count) => count > 0)
  if (counts.length === 0) {
    return 0.5
  }

  const total = counts.reduce((sum, count) => sum + count, 0)
  if (total <= 0) {
    return 0.5
  }

  const maxCount = Math.max(...counts)
  return Math.max(0, Math.min(1, maxCount / total))
}

function getSecondGenreShare(profileState: FullProfileData | undefined): number {
  const counts = (profileState?.teaser.topGenres ?? [])
    .map((entry) => entry.count)
    .filter((count) => count > 0)
    .sort((left, right) => right - left)

  if (counts.length < 2) {
    return 0
  }

  const total = counts.reduce((sum, count) => sum + count, 0)
  if (total <= 0) {
    return 0
  }

  return Math.max(0, Math.min(1, counts[1] / total))
}

function getSignalGenreShare(profileState: FullProfileData | undefined, signals: string[]): number {
  const entries = profileState?.teaser.topGenres ?? []
  if (entries.length === 0) {
    return 0
  }

  const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.count), 0)
  if (total <= 0) {
    return 0
  }

  let matched = 0
  for (const entry of entries) {
    const normalized = normalizeGenreText(entry.genre)
    if (signals.some((signal) => normalized.includes(normalizeGenreText(signal)))) {
      matched += Math.max(0, entry.count)
    }
  }

  return Math.max(0, Math.min(1, matched / total))
}

export function resolveRadarProfile(profileState: FullProfileData | undefined): FullProfileData["profile"] {
  const inferredFeatures = inferFeaturesFromGenreSignals(profileState)

  if (profileState?.profile) {
    const profile = profileState.profile
    return {
      ...profile,
      averageEnergy: resolveMetricValue(profile.averageEnergy, profileState.teaser.averageEnergy, inferredFeatures?.energy),
      averageValence: resolveMetricValue(profile.averageValence, profileState.teaser.averageValence, inferredFeatures?.valence),
      averageDanceability: resolveMetricValue(
        profile.averageDanceability,
        profileState.teaser.averageDanceability,
        inferredFeatures?.danceability
      ),
      genreVarietyScore: Number.isFinite(profile.genreVarietyScore)
        ? profile.genreVarietyScore
        : teaserVarietyScore(profileState),
    }
  }

  return {
    summary: null,
    dominantGenre: profileState?.teaser.topGenres[0]?.genre ?? null,
    genreVarietyScore: teaserVarietyScore(profileState),
    averageEnergy: resolveMetricValue(profileState?.teaser.averageEnergy, null, inferredFeatures?.energy),
    averageValence: resolveMetricValue(profileState?.teaser.averageValence, null, inferredFeatures?.valence),
    averageDanceability: resolveMetricValue(profileState?.teaser.averageDanceability, null, inferredFeatures?.danceability),
    decadeDistribution: {},
    generatedFromVotes: profileState?.completedBattlesCount ?? 0,
    updatedAt: new Date(0).toISOString(),
  }
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

function proximityScore(value: number, target: number, spread: number): number {
  if (spread <= 0) {
    return 0
  }

  return Math.max(0, 1 - Math.abs(value - target) / spread)
}

function resolvePersonaAffinityScores(
  profileState: FullProfileData | undefined,
  genreValues: string[],
  profile: NonNullable<ReturnType<typeof resolveRadarProfile>>
): Record<PersonaArchetype, number> {
  const energy = toUnit(profile.averageEnergy ?? null)
  const danceability = toUnit(profile.averageDanceability ?? null)
  const valence = toUnit(profile.averageValence ?? null)
  const variety = Math.max(0, Math.min(1, profile.genreVarietyScore ?? 0.5))
  const rhythm = Math.max(0, Math.min(1, danceability * 0.62 + energy * 0.38))
  const topDecade = Object.entries(profile.decadeDistribution ?? {})[0]?.[0] ?? ""
  const nostalgia = getNostalgiaScore(topDecade)
  const topGenreShare = getTopGenreShare(profileState)
  const secondGenreShare = getSecondGenreShare(profileState)
  const diversitySignal = Math.max(0, Math.min(1, (1 - topGenreShare) * 0.7 + secondGenreShare * 0.3))
  const hasSynthSignal = hasGenreSignal(genreValues, ["synth", "electro", "electronic", "house", "edm", "techno"])
  const hasAmbientSignal = hasGenreSignal(genreValues, ["dream", "ambient", "shoegaze", "indie", "lo fi"])
  const hasRockSignal = hasGenreSignal(genreValues, ["rock", "metal", "punk", "grunge", "hard rock"])
  const hasUrbanSignal = hasGenreSignal(genreValues, ["hip hop", "rap", "trap", "reggaeton", "urbano"])
  const hasPopSignal = hasGenreSignal(genreValues, ["pop"])
  const hasCumbiaSignal = hasGenreSignal(genreValues, ["cumbia", "latin"])
  const hasLatinSignal = hasGenreSignal(genreValues, ["latin", "latina", "cumbia", "reggaeton", "urbano"])
  const hasLatinUrbanBlend = hasGenreSignal(genreValues, ["latin urban", "urbano", "cumbia", "latin"])
  const hasClassicsSignal = hasGenreSignal(genreValues, ["classic", "classics", "70s", "80s", "90s"])
  const hasMillennialSignal = hasGenreSignal(genreValues, ["2000s", "2010s", "00s", "10s"])
  const rockShare = getSignalGenreShare(profileState, ["rock", "metal", "punk", "grunge", "hard rock"])
  const genreCount = genreValues.length

  const scores: Record<PersonaArchetype, number> = {
    chill_oracle:
      proximityScore(valence, 0.72, 0.28) * 3 +
      proximityScore(energy, 0.45, 0.34) * 2.2 +
      proximityScore(danceability, 0.48, 0.34) * 1.1 +
      proximityScore(variety, 0.5, 0.35) * 0.8,
    hyperpop_pilot:
      proximityScore(energy, 0.82, 0.3) * 3.1 +
      proximityScore(danceability, 0.8, 0.28) * 3 +
      proximityScore(rhythm, 0.8, 0.25) * 1.7 +
      proximityScore(variety, 0.5, 0.42) * 0.9 +
      (hasUrbanSignal ? 0.65 : 0),
    lo_fi_alchemist:
      proximityScore(energy, 0.3, 0.3) * 2.8 +
      proximityScore(danceability, 0.38, 0.3) * 2.3 +
      proximityScore(valence, 0.5, 0.3) * 1.4 +
      (hasAmbientSignal ? 0.6 : 0),
    neon_nomad:
      proximityScore(variety, 0.88, 0.24) * 3 +
      proximityScore(diversitySignal, 0.82, 0.28) * 1.1 +
      proximityScore(energy, 0.58, 0.35) * 1.4 +
      proximityScore(danceability, 0.58, 0.35) * 1.4 +
      proximityScore(rhythm, 0.6, 0.34) * 1.2 +
      (genreCount >= 3 ? 0.35 : 0),
    ranger:
      proximityScore(topGenreShare, 0.62, 0.3) * 0.95 +
      proximityScore(variety, 0.35, 0.35) * 1.2 +
      proximityScore(energy, 0.6, 0.4) * 1.8 +
      proximityScore(danceability, 0.46, 0.3) * 1.2 +
      (hasRockSignal ? 0.5 : 0),
    retro_scout:
      proximityScore(nostalgia, 0.8, 0.28) * 2 +
      proximityScore(valence, 0.58, 0.32) * 1.2 +
      proximityScore(energy, 0.56, 0.34) * 1.3 +
      proximityScore(danceability, 0.5, 0.32) * 0.9,
    synth_captain:
      proximityScore(energy, 0.72, 0.28) * 2.4 +
      proximityScore(danceability, 0.73, 0.28) * 2.4 +
      proximityScore(rhythm, 0.74, 0.24) * 1.5 +
      proximityScore(variety, 0.55, 0.4) * 0.9 +
      (hasSynthSignal ? 0.7 : 0),
    vaporwave_druid:
      proximityScore(energy, 0.42, 0.3) * 2.3 +
      proximityScore(valence, 0.56, 0.3) * 1.8 +
      proximityScore(danceability, 0.44, 0.32) * 1.3 +
      proximityScore(variety, 0.62, 0.35) * 1.4 +
      (hasAmbientSignal ? 0.7 : 0),
    metal_berserker:
      proximityScore(energy, 0.84, 0.26) * 3 +
      proximityScore(valence, 0.42, 0.28) * 1.8 +
      proximityScore(danceability, 0.4, 0.28) * 1.6 +
      proximityScore(topGenreShare, 0.58, 0.34) * 0.7 +
      (hasRockSignal ? 0.85 : 0),
    jester_groove:
      proximityScore(valence, 0.76, 0.27) * 2.2 +
      proximityScore(danceability, 0.7, 0.27) * 2.3 +
      proximityScore(energy, 0.66, 0.3) * 1.4 +
      proximityScore(variety, 0.62, 0.33) * 1.2 +
      (hasClassicsSignal ? 0.32 : 0),
    pop_paladin:
      proximityScore(valence, 0.82, 0.24) * 2.8 +
      proximityScore(danceability, 0.74, 0.24) * 2.4 +
      proximityScore(energy, 0.76, 0.24) * 2.1 +
      proximityScore(rhythm, 0.76, 0.2) * 1.3 +
      (hasPopSignal ? 0.52 : 0),
    pop_color_rebel:
      proximityScore(energy, 0.8, 0.24) * 2.4 +
      proximityScore(danceability, 0.8, 0.22) * 2.4 +
      proximityScore(variety, 0.68, 0.28) * 2 +
      proximityScore(valence, 0.78, 0.24) * 1.6 +
      (hasPopSignal && hasLatinSignal ? 0.45 : 0),
  }

  if (hasRockSignal && topGenreShare >= 0.44) {
    scores.ranger += 0.5
    scores.neon_nomad -= 0.45
  }

  if (hasClassicsSignal && hasRockSignal) {
    scores.retro_scout += 0.5
    scores.neon_nomad -= 0.3
  }

  if (hasClassicsSignal && hasMillennialSignal) {
    scores.retro_scout += 0.45
    scores.ranger -= 0.15
  }

  if (variety < 0.86) {
    scores.neon_nomad -= 0.2
  }

  if (topGenreShare >= 0.5 && secondGenreShare <= 0.22) {
    scores.neon_nomad -= 0.35
  }

  if (hasLatinSignal && danceability >= 0.52 && energy >= 0.58) {
    scores.hyperpop_pilot += 0.45
  }

  if (hasPopSignal && hasCumbiaSignal && danceability > 0.52) {
    scores.hyperpop_pilot += 0.4
    if (variety >= 0.7) {
      scores.neon_nomad += 0.4
    } else {
      scores.neon_nomad += 0.2
    }
    scores.ranger -= 0.25
  }

  if (hasLatinUrbanBlend && variety >= 0.66 && danceability >= 0.5) {
    scores.neon_nomad += 0.35
    scores.ranger -= 0.35
  }

  if (hasLatinUrbanBlend && danceability <= 0.5 && hasRockSignal) {
    scores.ranger += 0.25
  }

  if (hasRockSignal && rockShare < 0.45) {
    scores.ranger -= 0.4
    scores.retro_scout += 0.15
  }

  return scores
}

function resolveSecondaryPersonaSignalScore(
  persona: PersonaArchetype,
  profileState: FullProfileData | undefined,
  genreValues: string[],
  profile: NonNullable<ReturnType<typeof resolveRadarProfile>>
): number {
  const energy = toUnit(profile.averageEnergy ?? null)
  const danceability = toUnit(profile.averageDanceability ?? null)
  const valence = toUnit(profile.averageValence ?? null)
  const variety = Math.max(0, Math.min(1, profile.genreVarietyScore ?? 0.5))
  const rhythm = Math.max(0, Math.min(1, danceability * 0.62 + energy * 0.38))
  const topGenreShare = getTopGenreShare(profileState)
  const secondGenreShare = getSecondGenreShare(profileState)
  const topDecade = Object.entries(profile.decadeDistribution ?? {})[0]?.[0] ?? ""
  const nostalgia = getNostalgiaScore(topDecade)
  const hasSynthSignal = hasGenreSignal(genreValues, ["synth", "electro", "electronic", "house", "edm", "techno"])
  const hasAmbientSignal = hasGenreSignal(genreValues, ["dream", "ambient", "shoegaze", "indie", "lo fi"])
  const hasRockSignal = hasGenreSignal(genreValues, ["rock", "metal", "punk", "grunge", "hard rock"])
  const hasUrbanSignal = hasGenreSignal(genreValues, ["hip hop", "rap", "trap", "reggaeton", "urbano"])
  const hasLatinUrbanBlend = hasGenreSignal(genreValues, ["latin urban", "urbano", "cumbia", "latin"])

  const specialtyScores: Record<PersonaArchetype, number> = {
    chill_oracle: valence * 0.56 + (1 - energy) * 0.31 + (1 - danceability) * 0.13,
    hyperpop_pilot: energy * 0.33 + danceability * 0.39 + rhythm * 0.22 + (hasUrbanSignal ? 0.04 : 0) + (hasLatinUrbanBlend ? 0.02 : 0),
    lo_fi_alchemist: (1 - energy) * 0.48 + (1 - danceability) * 0.39 + (hasAmbientSignal ? 0.13 : 0),
    neon_nomad: variety * 0.62 + (1 - topGenreShare) * 0.24 + secondGenreShare * 0.14,
    ranger: (1 - variety) * 0.33 + energy * 0.24 + (1 - danceability) * 0.25 + topGenreShare * 0.12 + (hasRockSignal ? 0.06 : 0) + (hasLatinUrbanBlend ? -0.03 : 0),
    retro_scout: nostalgia * 0.48 + (1 - variety) * 0.2 + valence * 0.18 + (1 - danceability) * 0.14,
    synth_captain: danceability * 0.36 + energy * 0.29 + rhythm * 0.23 + (hasSynthSignal ? 0.12 : 0),
    vaporwave_druid: (1 - energy) * 0.36 + variety * 0.34 + (1 - danceability) * 0.18 + (hasAmbientSignal ? 0.12 : 0),
    metal_berserker: energy * 0.38 + (1 - valence) * 0.21 + (1 - danceability) * 0.24 + topGenreShare * 0.08 + (hasRockSignal ? 0.09 : 0),
    jester_groove: valence * 0.35 + danceability * 0.34 + variety * 0.19 + energy * 0.12,
    pop_paladin: valence * 0.41 + danceability * 0.3 + energy * 0.24 + (hasUrbanSignal ? 0.03 : 0) + (hasSynthSignal ? 0.02 : 0),
    pop_color_rebel: danceability * 0.35 + energy * 0.3 + variety * 0.27 + valence * 0.08 + (hasLatinUrbanBlend ? 0.03 : 0),
  }

  return specialtyScores[persona]
}

export function resolveSonicPersona(profileState: FullProfileData | undefined, genreValues: string[]): SonicPersona {
  const profile = resolveRadarProfile(profileState)
  if (!profile) {
    return {
      ...sonicPersonas.ranger,
      macroId: "ranger",
      subprofileId: "ranger_core",
    }
  }

  const affinityScores = resolvePersonaAffinityScores(profileState, genreValues, profile)
  const ranked = Object.entries(affinityScores)
    .map(([personaId, score]) => ({ personaId: personaId as PersonaArchetype, score }))
    .sort((left, right) => right.score - left.score)

  if (ranked.length === 0) {
    return {
      ...sonicPersonas.ranger,
      macroId: "ranger",
      subprofileId: "ranger_core",
    }
  }

  const top = ranked[0]
  const second = ranked[1]
  let selectedPersonaId: PersonaArchetype = top.personaId
  if (!second || top.score - second.score > 0.14) {
    selectedPersonaId = top.personaId
  } else {
    const closeCandidates = ranked.filter((entry) => top.score - entry.score <= 0.14)
    const bySecondary = closeCandidates
      .map((entry) => ({
        personaId: entry.personaId,
        score: resolveSecondaryPersonaSignalScore(entry.personaId, profileState, genreValues, profile),
      }))
      .sort((left, right) => right.score - left.score)

    const secondaryTop = bySecondary[0]
    const secondarySecond = bySecondary[1]
    if (!secondaryTop) {
      selectedPersonaId = top.personaId
    } else if (!secondarySecond || secondaryTop.score - secondarySecond.score > 0.06) {
      selectedPersonaId = secondaryTop.personaId
    } else {
      const dominantGenreSeed = profileState?.profile?.dominantGenre ?? profileState?.teaser.topGenres[0]?.genre ?? "mixed"
      const deterministicSeed = `${dominantGenreSeed.toLowerCase()}|${profileState?.completedBattlesCount ?? 0}|${
        profileState?.profile?.generatedFromVotes ?? 0
      }`
      const tieBreakIndex = pickDeterministicIndex(deterministicSeed, "persona-tie-break", 2)
      selectedPersonaId = tieBreakIndex === 0 ? secondaryTop.personaId : secondarySecond.personaId
    }
  }

  const macroPersona = resolveMacroPersona(selectedPersonaId)
  const subprofileId = resolveMacroSubprofile({
    macroPersona,
    profileState,
    profile,
    genreValues,
  })
  const resolvedPersona = mapSubprofileToPersona(subprofileId)

  return {
    ...resolvedPersona,
    macroId: macroPersona,
    subprofileId,
  }
}

function resolveMacroPersona(personaId: PersonaArchetype): MacroPersona {
  if (personaId === "hyperpop_pilot" || personaId === "synth_captain" || personaId === "pop_paladin" || personaId === "pop_color_rebel") {
    return "hyperpop"
  }
  if (personaId === "neon_nomad" || personaId === "retro_scout" || personaId === "vaporwave_druid" || personaId === "jester_groove") {
    return "neon"
  }

  return "ranger"
}

function resolveMacroSubprofile(params: {
  macroPersona: MacroPersona
  profileState: FullProfileData | undefined
  profile: NonNullable<ReturnType<typeof resolveRadarProfile>>
  genreValues: string[]
}): string {
  const { macroPersona, profileState, profile, genreValues } = params
  const energy = toUnit(profile.averageEnergy ?? null)
  const danceability = toUnit(profile.averageDanceability ?? null)
  const valence = toUnit(profile.averageValence ?? null)
  const variety = Math.max(0, Math.min(1, profile.genreVarietyScore ?? 0.5))
  const nostalgia = getNostalgiaScore(Object.entries(profile.decadeDistribution ?? {})[0]?.[0] ?? "")
  const hasAmbientSignal = hasGenreSignal(genreValues, ["dream", "ambient", "shoegaze", "indie", "lo fi"])
  const hasSynthSignal = hasGenreSignal(genreValues, ["synth", "electro", "electronic", "house", "edm", "techno"])
  const hasClassicsSignal = hasGenreSignal(genreValues, ["classic", "classics", "70s", "80s", "90s"])
  const hasMillennialSignal = hasGenreSignal(genreValues, ["2000s", "2010s", "00s", "10s"])
  const hasUrbanSignal = hasGenreSignal(genreValues, ["hip hop", "rap", "trap", "reggaeton", "urbano", "latin"])
  const hasPopSignal = hasGenreSignal(genreValues, ["pop"])
  const hasRockSignal = hasGenreSignal(genreValues, ["rock", "metal", "punk", "grunge", "hard rock"])
  const hasLatinSignal = hasGenreSignal(genreValues, ["latin", "cumbia", "reggaeton", "urbano"])
  const hasFolkSignal = hasGenreSignal(genreValues, ["folk", "folklore", "regional", "acoustic"])
  const urbanShare = getSignalGenreShare(profileState, ["hip hop", "rap", "trap", "reggaeton", "urbano", "latin", "cumbia", "pop"])
  const rockShare = getSignalGenreShare(profileState, ["rock", "metal", "punk", "grunge", "hard rock"])

  if (macroPersona === "ranger") {
    const shouldBeMetal =
      (hasRockSignal && energy >= 0.72 && valence <= 0.55) || (rockShare >= 0.48 && energy >= 0.7 && danceability <= 0.54)
    const shouldBeChill =
      (valence >= 0.62 && energy <= 0.62) || (hasFolkSignal && danceability <= 0.5 && energy <= 0.64 && valence >= 0.5)
    const shouldBeLofi =
      (energy <= 0.54 && danceability <= 0.52) || (hasAmbientSignal && energy <= 0.56 && danceability <= 0.56)

    if (shouldBeMetal) {
      return "ranger_metal"
    }
    if (shouldBeChill) {
      return "ranger_chill"
    }
    if (shouldBeLofi) {
      return "ranger_lofi"
    }
    return "ranger_core"
  }

  if (macroPersona === "hyperpop") {
    const shouldBePopColor =
      (hasPopSignal && energy >= 0.74 && danceability >= 0.72 && variety >= 0.6) ||
      (hasPopSignal && hasLatinSignal && energy >= 0.72 && danceability >= 0.7 && variety >= 0.58)
    const shouldBePopPaladin =
      (hasPopSignal && valence >= 0.68 && energy >= 0.7 && danceability >= 0.68) ||
      (valence >= 0.72 && danceability >= 0.68 && energy >= 0.68 && urbanShare <= 0.7)
    const shouldBeSynth =
      (hasSynthSignal && energy >= 0.64 && danceability >= 0.6 && urbanShare <= 0.68) ||
      (hasSynthSignal && variety >= 0.62 && danceability >= 0.58)
    if (shouldBePopColor) {
      return "hyperpop_pop_color"
    }
    if (shouldBePopPaladin) {
      return "hyperpop_pop_paladin"
    }
    if (shouldBeSynth) {
      return "hyperpop_synth"
    }
    return "hyperpop_urbano"
  }

  const shouldBeRetro =
    (hasClassicsSignal && hasMillennialSignal) ||
    nostalgia >= 0.62 ||
    (rockShare >= 0.38 && hasClassicsSignal) ||
    (hasClassicsSignal && danceability <= 0.58 && energy <= 0.7)
  if (shouldBeRetro) {
    return "neon_retro"
  }
  const shouldBeVapor =
    (hasAmbientSignal && energy <= 0.58 && variety >= 0.56) ||
    (hasFolkSignal && energy <= 0.6 && danceability <= 0.55 && variety >= 0.55)
  if (shouldBeVapor) {
    return "neon_vapor"
  }
  const shouldBeJester =
    (valence >= 0.66 && danceability >= 0.62 && hasClassicsSignal && !shouldBeRetro) ||
    (valence >= 0.7 && danceability >= 0.64 && variety >= 0.56 && energy >= 0.56)
  if (shouldBeJester) {
    return "neon_jester"
  }
  const shouldBeHybrid =
    (hasUrbanSignal && danceability >= 0.56 && variety >= 0.62) ||
    (hasPopSignal && hasLatinSignal && danceability >= 0.56 && variety >= 0.6)
  if (shouldBeHybrid) {
    return "neon_hibrido"
  }

  return "neon_hibrido"
}

function mapSubprofileToPersona(subprofileId: string): SonicPersona {
  if (subprofileId === "ranger_metal") {
    return sonicPersonas.metal_berserker
  }
  if (subprofileId === "ranger_chill") {
    return sonicPersonas.chill_oracle
  }
  if (subprofileId === "ranger_lofi") {
    return sonicPersonas.lo_fi_alchemist
  }
  if (subprofileId === "hyperpop_synth") {
    return sonicPersonas.synth_captain
  }
  if (subprofileId === "hyperpop_pop_paladin") {
    return sonicPersonas.pop_paladin
  }
  if (subprofileId === "hyperpop_pop_color") {
    return sonicPersonas.pop_color_rebel
  }
  if (subprofileId === "neon_retro") {
    return sonicPersonas.retro_scout
  }
  if (subprofileId === "neon_vapor") {
    return sonicPersonas.vaporwave_druid
  }
  if (subprofileId === "neon_jester") {
    return sonicPersonas.jester_groove
  }
  if (subprofileId === "hyperpop_urbano") {
    return sonicPersonas.hyperpop_pilot
  }
  if (subprofileId === "ranger_core") {
    return sonicPersonas.ranger
  }

  return sonicPersonas.neon_nomad
}

export function resolvePersonaDisplayName(persona: SonicPersona): string {
  const normalizedName = normalizeGenreText(persona.name).replace(/\s+/g, " ").trim()
  const candidates = normalizedName
    .split(" ")
    .concat(normalizeGenreText(persona.id).split("_"))
    .concat(normalizeGenreText(persona.assetFile).split(" "))

  for (const token of candidates) {
    const mappedName = personaDisplayNameByToken[token]
    if (mappedName) {
      return mappedName
    }
  }

  if (persona.name.includes("·")) {
    const variant = normalizeGenreText(persona.name.split("·").pop() ?? "")
    for (const token of variant.split(" ")) {
      const mappedName = personaDisplayNameByToken[token]
      if (mappedName) {
        return mappedName
      }
    }
  }

  return persona.name
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

function hashStringFnv1a(value: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function pickDeterministicIndex(seed: string, slot: string, size: number): number {
  if (size <= 0) {
    return 0
  }

  return hashStringFnv1a(`${seed}|${slot}`) % size
}

function resolvePersonaTone(profileState: FullProfileData | undefined): PersonaTone {
  const radarProfile = resolveRadarProfile(profileState)
  const energy = toUnit(radarProfile?.averageEnergy ?? null)
  const valence = toUnit(radarProfile?.averageValence ?? null)
  const weightedMood = energy * 0.65 + valence * 0.35

  if (weightedMood < 0.4) {
    return "low"
  }
  if (weightedMood > 0.68) {
    return "high"
  }

  return "medium"
}

function inferDecadeFromGenreLabels(labels: string[]): string | null {
  const normalized = labels.map((label) => normalizeGenreText(label))

  const hasClassicSignal = normalized.some(
    (label) => label.includes("classic") || label.includes("70s") || label.includes("80s") || label.includes("90s")
  )
  const hasMillennialSignal = normalized.some(
    (label) =>
      label.includes("2000s") ||
      label.includes("2010s") ||
      label.includes("00s") ||
      label.includes("10s") ||
      label.includes("millennial")
  )

  if (hasMillennialSignal) {
    return "2000s"
  }
  if (hasClassicSignal) {
    return "1990s"
  }

  return null
}

function getDominantDecadeLabel(profileState: FullProfileData | undefined, dominantGenres: string[]): string {
  const decadeFromGenres = inferDecadeFromGenreLabels(dominantGenres)
  if (decadeFromGenres) {
    return decadeFromGenres
  }

  const distributionEntries = Object.entries(profileState?.profile?.decadeDistribution ?? {})
  if (distributionEntries.length === 0) {
    return "mixed eras"
  }

  let dominantEntry = distributionEntries[0]
  for (const currentEntry of distributionEntries.slice(1)) {
    if (currentEntry[1] > dominantEntry[1]) {
      dominantEntry = currentEntry
    }
  }

  return dominantEntry[0]
}

function mapDecadeGroup(decadeLabel: string): DecadeGroup {
  const match = decadeLabel.match(/(\d{4})/)
  if (!match) {
    return "millennial"
  }

  const decade = Number.parseInt(match[1] ?? "", 10)
  if (!Number.isFinite(decade)) {
    return "millennial"
  }
  if (decade <= 1979) {
    return "classic"
  }
  if (decade <= 1999) {
    return "retro"
  }
  if (decade <= 2014) {
    return "millennial"
  }

  return "current"
}

function getVarietyCopy(varietyScore: number): string {
  if (varietyScore >= 0.75) {
    return "Mostrás una inclinación clara por descubrir contrastes entre estilos."
  }
  if (varietyScore >= 0.45) {
    return "Mantenés un equilibrio consistente entre territorio conocido y descubrimiento."
  }
  return "Tu selección mantiene foco firme y una identidad sonora bien definida."
}

function getToneSummaryCopy(tone: PersonaTone): string {
  if (tone === "high") {
    return "La energía general se mantiene alta y sostenida."
  }
  if (tone === "low") {
    return "El pulso general es sereno, con foco en detalle y matiz."
  }
  return "El clima general queda en un punto medio dinamico y controlado."
}

function getArchetypeSignature(archetype: PersonaArchetype): string {
  const signatures: Record<PersonaArchetype, string> = {
    chill_oracle: "Tu firma suena a refugio cómodo, con detalle fino y cero ruido de más.",
    hyperpop_pilot: "Tu firma entra con cohetes, brillo y una puntería que no falla.",
    lo_fi_alchemist: "Tu firma mezcla humo suave, texturas cálidas y mucha intención.",
    neon_nomad: "Tu firma arma rutas nuevas, cruza climas y nunca pierde el hilo.",
    ranger: "Tu firma va de frente, ordenada y estrategica como lider de campamento.",
    retro_scout: "Tu firma rescata joyas de otras épocas y las trae con actitud fresca.",
    synth_captain: "Tu firma manda pulsos eléctricos con precisión de consola central.",
    vaporwave_druid: "Tu firma pinta paisajes sonoros envolventes, casi como un sueño lúcido.",
    metal_berserker: "Tu firma empuja riffs pesados con ataque frontal y pulso de batalla.",
    jester_groove: "Tu firma convierte cada giro en escena viva, con ritmo y expresión.",
    pop_paladin: "Tu firma eleva hooks gigantes con energía limpia y vocación de himno.",
    pop_color_rebel: "Tu firma explota color pop, contraste y rebote bailable de alto impacto.",
  }

  return signatures[archetype]
}

function getTrailInstinctCopy(tone: PersonaTone): string {
  if (tone === "high") {
    return "Frente a comparaciones exigentes, respondés con decisiones rápidas y firmes."
  }
  if (tone === "low") {
    return "Frente a comparaciones exigentes, respondés con calma y criterio fino."
  }

  return "Frente a comparaciones exigentes, respondés con equilibrio y buena lectura del contexto."
}

function getCampEraCopy(group: DecadeGroup): string {
  const eraMap: Record<DecadeGroup, string> = {
    classic: "Tu referencia temporal se apoya en catálogo fundacional.",
    retro: "Tu referencia temporal prioriza catálogo retro con mirada actual.",
    millennial: "Tu referencia temporal cruza nostalgia digital y producción moderna.",
    current: "Tu referencia temporal se alinea con lanzamientos recientes.",
  }

  return eraMap[group]
}

function cleanNarrativeLine(line: string): string {
  return line.trim().replace(/[.!?]+$/g, "")
}

function compactNarrativeClause(line: string): string {
  return cleanNarrativeLine(line).replace(/[.!?]+\s+/g, ", ").replace(/\s*,\s*/g, ", ")
}

function lowerFirst(value: string): string {
  if (value.length === 0) {
    return value
  }

  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`
}

function buildPersonaDescription(params: {
  opening: string
  dominantGenre: string
  secondaryGenre: string
  toneSummary: string
  varietyCopy: string
  archetypeSignature: string
  trailInstinct: string
  campEra: string
}): string {
  const opening = compactNarrativeClause(params.opening)
  const sentenceOne = `${opening}.`
  const sentenceTwo =
    `Tu eje principal es ${params.dominantGenre} y se complementa con ${params.secondaryGenre}: ` +
    `${lowerFirst(cleanNarrativeLine(params.toneSummary))}, ${lowerFirst(cleanNarrativeLine(params.varietyCopy))}.`
  const sentenceThree =
    `${cleanNarrativeLine(params.archetypeSignature)}. ` +
    `${cleanNarrativeLine(params.trailInstinct)}. ` +
    `${cleanNarrativeLine(params.campEra)}.`

  return [sentenceOne, sentenceTwo, sentenceThree].join(" ")
}

function resolveDominantGenre(profileState: FullProfileData | undefined, dominantGenres: string[]): string {
  if (dominantGenres[0]) {
    return dominantGenres[0]
  }
  if (profileState?.profile?.dominantGenre) {
    return profileState.profile.dominantGenre
  }

  return profileState?.teaser.topGenres[0]?.genre ?? "sonidos mixtos"
}

function getHeadline(
  style: HeadlineStyle,
  persona: SonicPersona,
  archetypeLabel: string,
  dominantGenre: string,
  decadeGroup: DecadeGroup
): string {
  if (style === "totem") {
    return `${persona.name} // ${archetypeLabel}`
  }

  const decadeTagMap: Record<DecadeGroup, string> = {
    classic: "Classic Circuit",
    retro: "Retro Signal",
    millennial: "Millennial Wave",
    current: "Current Mode",
  }
  return `${decadeTagMap[decadeGroup]}: ${dominantGenre}`
}

export interface ResolvePersonaShareCopyParams {
  persona: SonicPersona
  profileState: FullProfileData | undefined
  dominantGenres: string[]
  userId?: string | null
  anonymousId?: string | null
}

export function resolvePersonaShareCopy(params: ResolvePersonaShareCopyParams): PersonaShareCopyResult {
  const { persona, profileState, dominantGenres, userId = null, anonymousId = null } = params
  const archetype: PersonaArchetype = isPersonaArchetype(persona.id) ? persona.id : "ranger"
  const catalogEntry = personaCopyCatalog[archetype]
  const dominantGenre = resolveDominantGenre(profileState, dominantGenres)
  const dominantDecadeLabel = getDominantDecadeLabel(profileState, dominantGenres)
  const decadeGroup = mapDecadeGroup(dominantDecadeLabel)
  const tone = resolvePersonaTone(profileState)
  const radarProfile = resolveRadarProfile(profileState)
  const generatedFromVotes = profileState?.profile?.generatedFromVotes ?? profileState?.completedBattlesCount ?? 0
  const identitySeed = userId ?? anonymousId ?? "guest"
  const sourceSeed = [
    persona.id,
    dominantGenre.toLowerCase(),
    decadeGroup,
    String(generatedFromVotes),
    identitySeed.toLowerCase(),
  ].join("|")
  const seed = hashStringFnv1a(sourceSeed)
  const templateIndex = pickDeterministicIndex(sourceSeed, "template", catalogEntry.templates.length)
  const headlineStyleIndex = pickDeterministicIndex(sourceSeed, "headline-style", 2)
  const headlineStyle: HeadlineStyle = headlineStyleIndex === 0 ? "totem" : "signal"
  const template = catalogEntry.templates[templateIndex]
  const toneCopy = catalogEntry.toneCopy[tone]
  const secondaryGenre = dominantGenres[1] ?? "escenas complementarias"
  const variety = Math.max(0, Math.min(1, radarProfile?.genreVarietyScore ?? teaserVarietyScore(profileState)))
  const description = buildPersonaDescription({
    opening: template.replace("{genre}", dominantGenre).replace("{toneCopy}", toneCopy),
    dominantGenre,
    secondaryGenre,
    toneSummary: getToneSummaryCopy(tone),
    varietyCopy: getVarietyCopy(variety),
    archetypeSignature: getArchetypeSignature(archetype),
    trailInstinct: getTrailInstinctCopy(tone),
    campEra: getCampEraCopy(decadeGroup),
  })
  const headline = getHeadline(headlineStyle, persona, catalogEntry.archetypeLabel, dominantGenre, decadeGroup)

  return {
    headline,
    description,
    meta: {
      archetype,
      tone,
      templateIndex,
      headlineStyle,
      decadeGroup,
      seed,
    },
  }
}

export function resolveDynamicPersonaDescription(
  persona: SonicPersona,
  profileState: FullProfileData | undefined,
  dominantGenres: string[]
): string {
  const profile = profileState?.profile
  const mainGenre = dominantGenres[0] ?? profile?.dominantGenre ?? "géneros mixtos"
  const secondGenre = dominantGenres[1] ?? "señales variadas"
  const topDecade = Object.entries(profile?.decadeDistribution ?? {})[0]?.[0] ?? "décadas mixtas"
  const energy = levelBand(profile?.averageEnergy ?? null)
  const dance = levelBand(profile?.averageDanceability ?? null)
  const mood = levelBand(profile?.averageValence ?? null)

  return `${persona.name}: tu selección prioriza ${mainGenre} y ${secondGenre}, con energía ${energy}, ánimo ${mood} y bailabilidad ${dance}. El patrón general muestra una preferencia consistente por ${topDecade}, con un criterio curatorial estable y enfocado.`
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
  const dominantGenre = normalizeGenreText(profile?.dominantGenre ?? "")
  const focusedRockSignal =
    dominantGenre.includes("rock") ||
    dominantGenre.includes("metal") ||
    dominantGenre.includes("classic") ||
    dominantGenre.includes("retro")
  const cohesionPenalty = Math.abs(energy - dance) <= 0.18 ? 0.06 : 0
  const focusPenalty = focusedRockSignal ? 0.12 : 0
  const nostalgiaPenalty = nostalgia >= 0.55 ? 0.04 : 0
  const exploration = Math.max(0.2, Math.min(1, variety - focusPenalty - cohesionPenalty - nostalgiaPenalty))

  return [
    { key: "energy", label: "Intensidad", value: energy },
    { key: "bpm", label: "Ritmo", value: rhythm },
    { key: "dance", label: "Baile", value: dance },
    { key: "nostalgia", label: "Nostalgia", value: nostalgia },
    { key: "valence", label: "Ánimo", value: valence },
    { key: "obscurity", label: "Exploración", value: exploration },
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

