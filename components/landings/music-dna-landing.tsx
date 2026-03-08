"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import useSWR from "swr"
import { Megaphone, Sparkles } from "lucide-react"
import {
  buildDynamicCode,
  buildDynamicHandle,
  fetcher,
  getDominantGenres,
  getRadarAxes,
  resolveDynamicPersonaDescription,
  resolveSonicPersona,
  type FullProfileResponse,
  type IdentitySessionResponse,
} from "@/lib/music-dna"
import { RadarChart } from "@/components/landings/music-dna/radar-chart"
import { ProfileMetricsPanel } from "@/components/landings/music-dna/profile-metrics-panel"

export function MusicDnaLanding() {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)

  const { data: session } = useSWR<IdentitySessionResponse>("/api/identity/session", fetcher, {
    revalidateOnFocus: false,
  })

  const { data: profileResponse, mutate: refreshProfile, isLoading } = useSWR<FullProfileResponse>(
    "/api/profile/full",
    fetcher,
    { revalidateOnFocus: false }
  )

  const profileState = profileResponse?.data
  const profile = profileState?.profile
  const profileError = profileResponse?.ok === false ? profileResponse.message : profileState?.error?.message

  const dominantGenres = useMemo(() => getDominantGenres(profileState), [profileState])
  const sonicPersona = useMemo(() => resolveSonicPersona(profileState, dominantGenres), [dominantGenres, profileState])
  const sonicPersonaDescription = useMemo(
    () => resolveDynamicPersonaDescription(sonicPersona, profileState, dominantGenres),
    [dominantGenres, profileState, sonicPersona]
  )
  const sonicPersonaHandle = useMemo(
    () => buildDynamicHandle(sonicPersona.handleBase, session?.userId ?? null, session?.anonymousId ?? null),
    [session?.anonymousId, session?.userId, sonicPersona.handleBase]
  )
  const sonicPersonaCode = useMemo(() => buildDynamicCode(sonicPersona.codename, profileState), [profileState, sonicPersona.codename])
  const radarAxes = useMemo(() => getRadarAxes(profile ?? null), [profile])
  const intensityScore = radarAxes.find((axis) => axis.key === "energy")?.value ?? 0.5
  const rhythmScore = radarAxes.find((axis) => axis.key === "bpm")?.value ?? 0.5
  const danceScore = radarAxes.find((axis) => axis.key === "dance")?.value ?? 0.5
  const explorationScore = radarAxes.find((axis) => axis.key === "obscurity")?.value ?? 0.5

  const totalBattles = profileState?.completedBattlesCount ?? 0
  const analyzedVotes = profile?.generatedFromVotes ?? totalBattles
  const level = Math.max(1, Math.round(totalBattles / 8))
  const levelProgress = Math.min(100, Math.round((totalBattles / Math.max(1, profileState?.unlockThreshold ?? 10)) * 100))

  const handleRegenerate = async () => {
    if (isRegenerating) {
      return
    }

    setIsRegenerating(true)
    setRegenerateError(null)

    try {
      const response = await fetch("/api/profile/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRegenerate: true }),
      })

      const payload = (await response.json().catch(() => ({}))) as FullProfileResponse
      if (!response.ok || payload.ok === false) {
        setRegenerateError(payload.message ?? "No se pudo regenerar Music DNA en este momento.")
      }

      await refreshProfile()
    } catch {
      setRegenerateError("Error de red al regenerar Music DNA.")
    } finally {
      setIsRegenerating(false)
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 pb-8 pt-24">
        <div className="rounded-2xl border-2 border-[#7a4c2a] bg-[#f3dfbf] px-5 py-3 text-sm font-bold text-[#4d2e1c]">
          Cargando analisis de Sonic DNA...
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[1200px] px-3 pb-8 pt-24 md:px-4">
      <section className="relative overflow-hidden rounded-[24px] border-[3px] border-[#6a3e22] bg-[#f4e0bf] text-[#2a1b14] shadow-[0_14px_0_0_#5d341b]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(255,184,108,0.24),transparent_38%),linear-gradient(130deg,#f6e7ca_0%,#efd0a4_100%)]" />

        <div className="relative grid gap-4 p-3 md:grid-cols-[280px_minmax(0,1fr)_250px] md:p-4">
          <aside className="rounded-[18px] border-[3px] border-[#7d4f2b] bg-[#efd2a6] p-3 shadow-[0_6px_0_0_#8c6139]">
            <div className="rounded-[14px] border-2 border-[#5f381f] bg-[#e7bf8b] px-3 py-2 text-center shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]">
              <p className="text-3xl font-black uppercase leading-[0.95] tracking-tight">Persona Sonica</p>
              <p className="mt-1 text-3xl font-black uppercase leading-[0.95] tracking-tight">Campamento</p>
            </div>

            <div className="mx-auto mt-4 flex w-full max-w-[210px] justify-center rounded-[20px] border-[3px] border-[#5f381f] bg-[#fae8cc] p-2 shadow-[0_5px_0_0_#8a6040]">
              <Image
                src={`/images/characters/${sonicPersona.assetFile}`}
                alt={`${sonicPersona.name} avatar`}
                width={190}
                height={220}
                className="h-auto w-full rounded-[12px] border-2 border-[#6b432a] object-cover"
                priority
              />
            </div>

            <div className="mt-4 rounded-[14px] border-[3px] border-[#6f4528] bg-[#f6e9d0] px-3 py-2 text-center shadow-[0_4px_0_0_#8f6341]">
              <p className="text-3xl font-black uppercase leading-tight">{sonicPersona.name}</p>
              <p className="text-lg font-bold text-[#583321]">{sonicPersonaHandle}</p>
            </div>

            <div className="mt-3 rounded-[14px] border-[3px] border-[#6f4528] bg-[#f9e5c5] px-3 py-2 text-left shadow-[0_4px_0_0_#8f6341]">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6f4528]">Perfil de Persona</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-[#4a2a1d]">{sonicPersonaDescription}</p>
            </div>

            <div className="mt-4 rounded-full border-[3px] border-[#23355f] bg-[#152848] p-1">
              <div className="relative h-7 overflow-hidden rounded-full bg-[#253f6f]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#f8de54_0%,#f0c42a_38%,#4cca78_72%,#1ea95d_100%)]"
                  style={{ width: `${levelProgress}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black uppercase tracking-wide text-[#111]">
                  Nivel {level}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <article className="rounded-full border-[3px] border-[#8a5e3a] bg-[#d79d5e] p-4 text-center shadow-[0_4px_0_0_#8f623e]">
                <p className="text-[11px] font-black uppercase tracking-wide">Batallas Totales</p>
                <p className="mt-1 text-4xl font-black leading-none">{totalBattles}</p>
              </article>
              <article className="rounded-full border-[3px] border-[#8a5e3a] bg-[#d79d5e] p-4 text-center shadow-[0_4px_0_0_#8f623e]">
                <p className="text-[11px] font-black uppercase tracking-wide">Votos Analizados</p>
                <p className="mt-1 text-4xl font-black leading-none">{analyzedVotes}</p>
              </article>
            </div>
          </aside>

          <section className="rounded-[18px] border-[3px] border-[#7d4f2b] bg-[#f6e7ca] p-4 shadow-[0_6px_0_0_#9f7347] md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#9c7049] pb-3">
              <div>
                <h1 className="text-4xl font-black uppercase leading-none tracking-tight md:text-5xl">Analisis Sonic DNA</h1>
                <p className="mt-2 text-sm font-semibold md:text-base">Tu huella auditiva en base a tus ultimas {analyzedVotes} batallas.</p>
                <p className="mt-2 inline-flex rounded-full border-2 border-[#845537] bg-[#ecd2ae] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#4a2c1f]">
                  Persona Asignada: {sonicPersona.name} ({sonicPersonaCode})
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[16px] border-[3px] border-[#9f7350] bg-[#eed5ad] p-4 shadow-[inset_0_0_0_2px_rgba(140,94,55,0.4)]">
              <div className="mx-auto max-w-[560px] rounded-full border-[4px] border-[#9a7351] bg-[#f7ecd8] p-4 md:p-5">
                <RadarChart axes={radarAxes} />
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-3">
            <section className="rounded-[16px] border-[3px] border-[#7d4f2b] bg-[#f0d7b4] p-3 shadow-[0_5px_0_0_#9d7147]">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase tracking-tight">Generos Dominantes</h2>
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(dominantGenres.length > 0 ? dominantGenres : ["Formato Abierto"]).map((genre, index) => (
                  <span
                    key={genre}
                    className={`rounded-full border-2 px-3 py-1 text-xs font-black uppercase tracking-wide ${
                      index % 2 === 0 ? "border-[#5f3078] bg-[#e38dde] text-[#351b4a]" : "border-[#1c6176] bg-[#8ad6ef] text-[#103543]"
                    }`}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </section>

            <ProfileMetricsPanel
              intensityScore={intensityScore}
              rhythmScore={rhythmScore}
              danceScore={danceScore}
              explorationScore={explorationScore}
            />

            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="rounded-[20px] border-[3px] border-[#2d3d7f] bg-[linear-gradient(180deg,#4f71c7_0%,#27418e_100%)] p-4 text-left text-[#f8eecf] shadow-[0_6px_0_0_#1b2c63] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <div className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide">
                <Megaphone className="h-5 w-5" />
                Compartir DNA
              </div>
              <p className="mt-2 text-lg font-black uppercase tracking-wide">{isRegenerating ? "Remixeando..." : "Remix DNA"}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#d3ddff]">Regenerar tarjeta de personalidad sonora</p>
            </button>
          </aside>
        </div>
      </section>

      {(profileError || regenerateError) && (
        <section className="mt-4 rounded-xl border-2 border-[#8f3f2b] bg-[#ffd9c9] px-4 py-2 text-sm font-bold text-[#5b2618]">
          {regenerateError ?? profileError}
        </section>
      )}
    </main>
  )
}
