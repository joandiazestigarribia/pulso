"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  Compass,
  Disc3,
  Flame,
  Heart,
  type LucideIcon,
  Moon,
  Radio,
  Sparkles,
  Sun,
  WandSparkles,
} from "lucide-react"
import { motion } from "framer-motion"

const fetcher = (url: string) => fetch(url).then((response) => response.json())

interface IdentitySessionResponse {
  isAuthenticated: boolean
  userId: string | null
  anonymousId: string | null
  spotifyConnected: boolean
  spotifyTokenError: string | null
}

interface FullProfileResponse {
  ok: boolean
  code?: string
  message?: string
  data?: {
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
}

interface DnaArchetype {
  id: string
  name: string
  code: string
  description: string
  flavor: string
  icon: LucideIcon
  accentClass: string
  bgClass: string
}

function toPercent(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) {
    return null
  }

  return Math.round(value * 100)
}

function metricLabel(value: number | null): "low" | "balanced" | "high" {
  if (value === null) {
    return "balanced"
  }

  if (value < 0.4) {
    return "low"
  }

  if (value > 0.65) {
    return "high"
  }

  return "balanced"
}

function buildPrimaryArchetype(response: FullProfileResponse["data"]): DnaArchetype {
  const profile = response?.profile
  const dominantGenre = profile?.dominantGenre ?? "Mixed Signal"
  const variety = profile?.genreVarietyScore ?? 0
  const energy = profile?.averageEnergy ?? 0.5
  const valence = profile?.averageValence ?? 0.5
  const danceability = profile?.averageDanceability ?? 0.5

  if (variety >= 0.72) {
    return {
      id: "genre-nomad",
      name: "Nomada de Generos",
      code: "PX-NMD",
      description: `Saltas de ${dominantGenre} a sonidos inesperados sin despeinarte. Tu playlist parece un multiverso bien curado.`,
      flavor: "Mood: sorpresa elegante con cero culpa musical.",
      icon: Compass,
      accentClass: "text-neon-cyan",
      bgClass: "from-neon-cyan/20 to-campfire-purple/20",
    }
  }

  if (danceability >= 0.66 && valence >= 0.55) {
    return {
      id: "dance-engine",
      name: "Motor de Pista",
      code: "PX-DNC",
      description: `Tus ganadoras encienden cualquier sala. Si hay beat y buena vibra, tu voto ya esta levantando polvo.`,
      flavor: "Mood: viernes a las 2am aunque sea martes.",
      icon: Flame,
      accentClass: "text-campfire-lime",
      bgClass: "from-campfire-lime/20 to-campfire-orange/20",
    }
  }

  if (energy >= 0.7 && valence < 0.5) {
    return {
      id: "night-voltage",
      name: "Voltaje Nocturno",
      code: "PX-NGT",
      description: `Tu gusto corre rapido y con filo. Prefieres tracks intensos que suenan a ciudad mojada y neones prendidos.`,
      flavor: "Mood: drama epico con buen bajo.",
      icon: Moon,
      accentClass: "text-campfire-pink",
      bgClass: "from-campfire-pink/20 to-campfire-purple/20",
    }
  }

  if (valence >= 0.68 && energy < 0.58) {
    return {
      id: "sun-curator",
      name: "Curador Solar",
      code: "PX-SUN",
      description: `Tu DNA prioriza tracks luminosos y melodia amable. Eres ese amigo que arregla el ambiente con una sola cancion.`,
      flavor: "Mood: golden hour en loop.",
      icon: Sun,
      accentClass: "text-neon-yellow",
      bgClass: "from-neon-yellow/20 to-campfire-orange/20",
    }
  }

  return {
    id: "neon-alchemist",
    name: "Alquimista Neon",
    code: "PX-ALQ",
    description: `Mezclas estilos con precision rara: ni caotico ni obvio. Tu perfil suena a criterio fuerte y curiosidad constante.`,
    flavor: "Mood: laboratorio secreto de hits.",
    icon: WandSparkles,
    accentClass: "text-campfire-purple",
    bgClass: "from-campfire-purple/20 to-neon-cyan/20",
  }
}

function buildSupportArchetypes(response: FullProfileResponse["data"]): DnaArchetype[] {
  const profile = response?.profile
  const topGenre = response?.teaser.topGenres[0]?.genre ?? "Open Format"
  const topSubgenre = response?.teaser.topSubgenres[0]?.genre ?? "Wildcard"
  const topDecade = Object.entries(profile?.decadeDistribution ?? {})[0]?.[0] ?? "mixed decades"
  const energyBand = metricLabel(profile?.averageEnergy ?? null)

  return [
    {
      id: "genre-core",
      name: "Nucleo Sonoro",
      code: "DNA-GEN",
      description: `Tu zona caliente combina ${topGenre} con acentos de ${topSubgenre}. No eliges por moda: eliges por impacto.`,
      flavor: "Selector mode: ON.",
      icon: Disc3,
      accentClass: "text-neon-cyan",
      bgClass: "from-neon-cyan/20 to-neon-green/10",
    },
    {
      id: "timeline",
      name: "Radar Temporal",
      code: "DNA-TME",
      description: `Tus votos muestran debilidad por ${topDecade}. Tienes memoria musical activa y buen olfato para clasicos que envejecen bien.`,
      flavor: "Vintage taste, current reflexes.",
      icon: Radio,
      accentClass: "text-campfire-orange",
      bgClass: "from-campfire-orange/20 to-campfire-purple/10",
    },
    {
      id: "mood-engine",
      name: "Motor Emocional",
      code: "DNA-MOD",
      description: `Tu energia se comporta en nivel ${energyBand}. Tu perfil mantiene personalidad propia sin sonar repetitivo.`,
      flavor: "Sin relleno, todo vibe.",
      icon: Heart,
      accentClass: "text-campfire-pink",
      bgClass: "from-campfire-pink/20 to-campfire-purple/10",
    },
  ]
}

function formatMetric(value: number | null): string {
  const pct = toPercent(value)
  return pct === null ? "N/A" : `${pct}%`
}

export function MusicDnaLanding() {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)

  const { data: session } = useSWR<IdentitySessionResponse>("/api/identity/session", fetcher, {
    revalidateOnFocus: false,
  })

  const { data: profileResponse, mutate: refreshProfile, isLoading } = useSWR<FullProfileResponse>(
    "/api/profile/full",
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  const profileState = profileResponse?.data
  const profile = profileState?.profile
  const profileError = profileResponse?.ok === false ? profileResponse.message : profileState?.error?.message

  const primaryArchetype = useMemo(() => buildPrimaryArchetype(profileState), [profileState])
  const supportArchetypes = useMemo(() => buildSupportArchetypes(profileState), [profileState])

  const handleRegenerate = async () => {
    if (isRegenerating) {
      return
    }

    setIsRegenerating(true)
    setRegenerateError(null)

    try {
      const response = await fetch("/api/profile/full", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ forceRegenerate: true }),
      })

      const payload = (await response.json().catch(() => ({}))) as FullProfileResponse
      if (!response.ok || payload.ok === false) {
        setRegenerateError(payload.message ?? "Unable to regenerate Music DNA right now.")
      }

      await refreshProfile()
    } catch {
      setRegenerateError("Network error while regenerating Music DNA.")
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-20">
      <section className="relative overflow-hidden rounded-[30px] border-4 border-black bg-[#151515]/90 p-6 shadow-[0_10px_0_0_rgba(0,0,0,0.25)] md:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -top-16 -left-10 h-44 w-44 rounded-full bg-campfire-purple blur-3xl" />
          <div className="absolute -right-8 bottom-0 h-40 w-40 rounded-full bg-neon-cyan blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-black/50 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neon-cyan">
              <Sparkles className="h-3.5 w-3.5" />
              Music DNA Report
            </span>
            <h1 className="mt-3 text-3xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
              Tu Personalidad Musical
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/75 md:text-base">
              Una landing dedicada a tu resultado: arquetipo principal, rasgos secundarios y resumen divertido basado en tus battles.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="rounded-2xl border-4 border-black bg-[#FFE600] px-5 py-3 text-xs font-black uppercase tracking-wider text-black shadow-[0_8px_0_0_rgba(0,0,0,0.25)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRegenerating ? "Regenerating..." : "Remix Result"}
          </button>
        </div>
      </section>

      {isLoading && (
        <section className="rounded-3xl border border-campfire-purple/30 bg-carbon-light/80 p-5 text-sm text-foreground/70">
          Loading Music DNA...
        </section>
      )}

      {!isLoading && profileState && !profileState.unlocked && (
        <section className="rounded-3xl border border-campfire-purple/30 bg-carbon-light/80 p-6">
          <h2 className="text-lg font-black uppercase tracking-wide text-foreground">DNA Locked</h2>
          <p className="mt-2 text-sm text-foreground/75">{profileState.teaser.hint}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-carbon-lighter">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-campfire-pink to-campfire-purple"
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, (profileState.completedBattlesCount / profileState.unlockThreshold) * 100)}%`,
              }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <p className="mt-2 text-xs font-mono uppercase tracking-wider text-foreground/60">
            {profileState.completedBattlesCount}/{profileState.unlockThreshold} battles
          </p>
          <div className="mt-4">
            <Link
              href="/battle"
              className="inline-flex rounded-xl border-2 border-black bg-campfire-lime px-4 py-2 text-xs font-black uppercase tracking-wider text-black shadow-[0_6px_0_0_rgba(0,0,0,0.2)]"
            >
              Keep battling
            </Link>
          </div>
        </section>
      )}

      {profile && (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <article className="relative overflow-hidden rounded-3xl border-4 border-black bg-[#121212]/90 p-6 shadow-[0_10px_0_0_rgba(0,0,0,0.25)]">
              <div className={`absolute inset-0 bg-gradient-to-br ${primaryArchetype.bgClass} opacity-50`} />
              <div className="relative z-10">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-black bg-black/70">
                    <primaryArchetype.icon className={`h-8 w-8 ${primaryArchetype.accentClass}`} />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/65">
                      Primary Archetype / {primaryArchetype.code}
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                      {primaryArchetype.name}
                    </h2>
                  </div>
                </div>

                <p className="text-sm text-white/85 md:text-base">{primaryArchetype.description}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-white/70">{primaryArchetype.flavor}</p>

                <div className="mt-4 rounded-2xl border border-white/15 bg-black/35 p-4 text-sm text-white/85">
                  {profile.summary ?? "Your Music DNA summary is warming up. Hit Remix Result to regenerate."}
                </div>
              </div>
            </article>

            <article className="rounded-3xl border-4 border-black bg-[#171717]/90 p-5 shadow-[0_10px_0_0_rgba(0,0,0,0.25)]">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-neon-cyan">DNA Signals</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/15 bg-black/35 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/55">Energy</div>
                  <div className="mt-1 text-lg font-black text-white">{formatMetric(profile.averageEnergy)}</div>
                </div>
                <div className="rounded-xl border border-white/15 bg-black/35 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/55">Mood</div>
                  <div className="mt-1 text-lg font-black text-white">{formatMetric(profile.averageValence)}</div>
                </div>
                <div className="rounded-xl border border-white/15 bg-black/35 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/55">Dance</div>
                  <div className="mt-1 text-lg font-black text-white">{formatMetric(profile.averageDanceability)}</div>
                </div>
                <div className="rounded-xl border border-white/15 bg-black/35 p-3">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/55">Variety</div>
                  <div className="mt-1 text-lg font-black text-white">
                    {Math.round(profile.genreVarietyScore * 100)}%
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-white/60">
                Votes analyzed: {profile.generatedFromVotes} {session?.userId ? `- ${session.userId}` : ""}
              </p>
            </article>
          </section>

          <section className="rounded-3xl border-4 border-black bg-[#111111]/90 p-5 shadow-[0_10px_0_0_rgba(0,0,0,0.25)]">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-campfire-lime" />
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white">Rasgos Secundarios</h3>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {supportArchetypes.map((item) => (
                <article
                  key={item.id}
                  className="relative overflow-hidden rounded-2xl border-2 border-white/10 bg-black/40 p-4"
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.bgClass} opacity-50`} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2">
                      <item.icon className={`h-4 w-4 ${item.accentClass}`} />
                      <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/65">{item.code}</span>
                    </div>
                    <h4 className="mt-2 text-base font-black uppercase tracking-tight text-white">{item.name}</h4>
                    <p className="mt-2 text-xs text-white/80">{item.description}</p>
                    <p className="mt-2 text-[11px] font-semibold text-white/65">{item.flavor}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {(profileError || regenerateError) && (
        <section className="rounded-2xl border border-campfire-pink/30 bg-campfire-pink/10 p-3 text-xs text-campfire-pink">
          {regenerateError ?? profileError}
        </section>
      )}
    </main>
  )
}
