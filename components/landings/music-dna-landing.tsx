"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import useSWR from "swr"
import { Copy, Megaphone, RefreshCcw, Share2 } from "lucide-react"
import {
  fetcher,
  getDominantGenres,
  getRadarAxes,
  resolvePersonaShareCopy,
  resolveRadarProfile,
  resolveSonicPersona,
  type FullProfileResponse,
  type IdentitySessionResponse,
} from "@/lib/music-dna"
import { RadarChart } from "@/components/landings/music-dna/radar-chart"
import { ProfileMetricsPanel } from "@/components/landings/music-dna/profile-metrics-panel"
import { WoodActionButton } from "@/components/landings/wood-action-button"

const musicDnaBackgroundStyle = {
  backgroundImage: "url('/images/music-dna/background-music-dna.png')",
  backgroundPosition: "center",
  backgroundSize: "auto",
} as const

export function MusicDnaLanding() {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)

  const { data: profileResponse, mutate: refreshProfile, isLoading } = useSWR<FullProfileResponse>(
    "/api/profile/full",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: identitySession } = useSWR<IdentitySessionResponse>("/api/identity/session", fetcher, {
    revalidateOnFocus: false,
  })

  const profileState = profileResponse?.data
  const profile = profileState?.profile
  const profileError = profileResponse?.ok === false ? profileResponse.message : profileState?.error?.message

  const dominantGenres = useMemo(() => getDominantGenres(profileState), [profileState])
  const sonicPersona = useMemo(() => resolveSonicPersona(profileState, dominantGenres), [dominantGenres, profileState])
  const shareCopy = useMemo(
    () =>
      resolvePersonaShareCopy({
        persona: sonicPersona,
        profileState,
        dominantGenres,
        userId: identitySession?.userId ?? null,
        anonymousId: identitySession?.anonymousId ?? null,
      }),
    [dominantGenres, identitySession?.anonymousId, identitySession?.userId, profileState, sonicPersona]
  )
  const radarProfile = useMemo(() => resolveRadarProfile(profileState), [profileState])
  const radarAxes = useMemo(() => getRadarAxes(radarProfile), [radarProfile])
  const intensityScore = radarAxes.find((axis) => axis.key === "energy")?.value ?? 0.5
  const rhythmScore = radarAxes.find((axis) => axis.key === "bpm")?.value ?? 0.5
  const danceScore = radarAxes.find((axis) => axis.key === "dance")?.value ?? 0.5
  const explorationScore = radarAxes.find((axis) => axis.key === "obscurity")?.value ?? 0.5

  const totalBattles = profileState?.completedBattlesCount ?? 0
  const analyzedVotes = profile?.generatedFromVotes ?? totalBattles
  const shareDescription =
    shareCopy.description || "Tu seleccion combina energia, ritmo y estilo con una firma sonora unica."
  const shareTitle = `${sonicPersona.name} | Music DNA Pulso`

  const buildShareUrl = (): string => {
    if (typeof window === "undefined") {
      return "https://pulso.app/music-dna"
    }
    return window.location.href
  }

  const buildShareText = (): string => `${shareCopy.headline}\n${shareDescription}`

  const shareToNetwork = (network: "x" | "whatsapp" | "telegram" | "facebook") => {
    const url = encodeURIComponent(buildShareUrl())
    const text = encodeURIComponent(buildShareText())

    const shareLinks: Record<typeof network, string> = {
      x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${buildShareText()} ${buildShareUrl()}`)}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    }

    window.open(shareLinks[network], "_blank", "noopener,noreferrer")
  }

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(`${buildShareText()}\n${buildShareUrl()}`)
      setShareFeedback("Link copiado. Ya podes compartir tu perfil sonoro.")
    } catch {
      setShareFeedback("No se pudo copiar el link automaticamente.")
    }
  }

  const handleNativeShare = async () => {
    if (!navigator.share) {
      setShareFeedback("Tu navegador no soporta share nativo. Usa las redes o copia link.")
      return
    }

    try {
      await navigator.share({
        title: shareTitle,
        text: buildShareText(),
        url: buildShareUrl(),
      })
      setShareFeedback("Perfil compartido con exito.")
    } catch {
      setShareFeedback("Se cancelo el compartido.")
    }
  }

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
      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center overflow-hidden px-4 pb-8 pt-24">
        <div className="pointer-events-none fixed inset-0 z-0 opacity-90" style={musicDnaBackgroundStyle} />
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.14),transparent_45%),radial-gradient(circle_at_75%_15%,rgba(255,67,248,0.2),transparent_45%),linear-gradient(180deg,rgba(8,11,26,0.74),rgba(8,11,26,0.92))]" />
        <div className="relative z-10 rounded-2xl border-2 border-[#00f0ff]/40 bg-[#120a26]/80 px-5 py-3 text-sm font-bold text-[#eaf7ff]">
          Cargando analisis...
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#080b1a] pb-8 pt-15 text-[#eaf7ff] md:px-4">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-90" style={musicDnaBackgroundStyle} />
      <section className="relative z-10 mx-auto max-w-300 overflow-hidden rounded-[28px] bg-[#090d25]/45 text-[#eaf7ff] backdrop-blur-sm mt-5">
        <div className="pointer-events-none absolute inset-0" />
        <div className="relative grid gap-4 pt-0 px-3 md:grid-cols-[350px_minmax(0,1fr)]">
          <aside className="relative overflow-hidden pt-5 pb-3 px-3">
            <div className="mx-auto max-w-77.5 rounded-3xl border border-white/25 bg-black/40 px-4 py-4 text-center shadow-[0_0_32px_rgba(0,240,255,0.18)]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7be3ff]">Pulso Experience</p>
              <p className="mt-2 bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text font-sonic-persona text-4xl font-black uppercase leading-[0.95] tracking-tight text-transparent">
                Campground
              </p>
            </div>

            <div className="relative mx-auto mt-4 flex w-full max-w-53.5 justify-center">
              <Image
                src={`/images/characters/${sonicPersona.assetFile}`}
                alt={`${sonicPersona.name} avatar`}
                width={190}
                height={220}
                className="h-auto w-full rounded-[12px] object-cover drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]"
                priority
              />
            </div>

            <div className="relative px-1">
              <div className="mx-auto mt-3 w-full rounded-2xl border border-[#ff43f8]/35 bg-[#121a40]/72 px-3 py-3 text-center shadow-[inset_0_0_0_1px_rgba(0,240,255,0.14)]">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7be3ff]">Perfil Sonoro</p>
                <p className="mt-1 bg-gradient-to-r from-[#ff43f8] via-[#ffe600] to-[#00f0ff] bg-clip-text font-sonic-persona text-[28px] font-black uppercase leading-none text-transparent">
                  {sonicPersona.name}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <article className="mx-auto w-full max-w-38 rounded-[22px] border border-[#00f0ff]/40 bg-[#10183b]/78 px-2 py-3 text-center shadow-[0_10px_18px_rgba(0,0,0,0.28)]">
                <p className="mx-auto w-[70%] text-[11px] font-black uppercase tracking-wide leading-normal text-[#7be3ff]">Batallas Totales</p>
                <p className="mt-1 text-[44px] font-black leading-[0.8] text-[#eaf7ff]">{totalBattles}</p>
              </article>
              <article className="mx-auto w-full max-w-38 rounded-[22px] border border-[#ff43f8]/40 bg-[#151339]/78 px-2 py-3 text-center shadow-[0_10px_18px_rgba(0,0,0,0.28)]">
                <p className="mx-auto w-[70%] text-[11px] font-black uppercase tracking-wide leading-normal text-[#ffb5fb]">Votos Analizados</p>
                <p className="mt-1 text-[44px] font-black leading-[0.8] text-[#eaf7ff]">{analyzedVotes}</p>
              </article>
            </div>
          </aside>
          <div className="grid gap-3 py-5 md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            <section className="rounded-[34px_22px_30px_20px] bg-[#0d1232]/72 p-4 shadow-[0_14px_38px_rgba(0,0,0,0.35)] backdrop-blur-sm md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#00f0ff]/25 pb-3">
              <div>
                <h1 className="bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-4xl font-black uppercase leading-none tracking-tight text-transparent md:text-5xl">
                  Tu huella auditiva
                </h1>
                <p className="mt-2 text-sm font-semibold text-[#d8e9ff] md:text-base">En base a tus ultimas {analyzedVotes} batallas.</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#82dff2]">
                  Cuantas mas battles votes, mayor precision tendra tu Music DNA.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[24px_18px_22px_16px] border border-[#ff43f8]/25 bg-[#121a40]/74 p-4 shadow-[inset_0_0_0_1px_rgba(0,240,255,0.15),0_12px_24px_rgba(0,0,0,0.28)]">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7be3ff]">Perfil Sonoro</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#eaf7ff]">
                {shareCopy.description || "Tu seleccion combina energia, ritmo y estilo con una firma sonora unica."}
              </p>
            </div>
            <div className="relative mt-6 px-3 py-3 text-left">
              <p className="border-b border-[#00f0ff]/20 pb-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#7be3ff]">Radar Sonoro</p>
              <div className="mt-2 rounded-2xl bg-black/18 p-2">
                <RadarChart axes={radarAxes} />
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-3">
            <section className="rounded-[30px_16px_24px_14px] bg-[#111739]/74 p-3 shadow-[0_10px_18px_rgba(0,0,0,0.28)] ring-1 ring-[#00f0ff]/20">
              <div className="flex items-center justify-between">
                <h2 className="bg-gradient-to-r from-[#00f0ff] to-[#ff43f8] bg-clip-text text-2xl font-black uppercase tracking-tight text-transparent">Generos Dominantes</h2>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(dominantGenres.length > 0 ? dominantGenres : ["Formato Abierto"]).map((genre, index) => (
                  <span
                    key={genre}
                    className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${
                      index % 2 === 0 ? "bg-[#ff43f8]/25 text-[#ffd8ff] ring-[#ff43f8]/45" : "bg-[#00f0ff]/22 text-[#d7faff] ring-[#00f0ff]/45"
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

            <article className="mb-4">
              <p className="mt-4 mb-2 px-1 text-xs font-black uppercase tracking-[0.08em] text-[#d8ebff]">
                Comparte con tus amigos tu perfil sonoro!
              </p>
              <div
                className=""
              >
                <WoodActionButton
                  onClick={() => {
                    setShareFeedback(null)
                    setIsShareOpen(true)
                  }}
                  variant="neonPink"
                  icon={<Megaphone className="h-4 w-4" />}
                >
                  Compartir
                </WoodActionButton>
              </div>
            </article>

            <article>
              <p className="mb-2 px-1 text-xs font-black uppercase tracking-[0.08em] text-[#d8ebff]">
                Reinicia tu perfil sonoro e inicia de nuevo
              </p>
              <div
                className=""
              >
                <WoodActionButton
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  variant="neonGreen"
                  icon={<RefreshCcw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />}
                >
                  {isRegenerating ? "Reiniciando..." : "Reiniciar"}
                </WoodActionButton>
              </div>
            </article>
          </aside>
          </div>
        </div>
      </section>

      {isShareOpen && (
        <section className="fixed inset-0 z-70 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-140 rounded-3xl border-[3px] border-[#00f0ff]/35 bg-[#0f1638]/92 p-4 text-[#eaf7ff] shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-3 border-b-2 border-[#00f0ff]/25 pb-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7be3ff]">Compartir Music DNA</p>
                <h3 className="mt-1 bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-2xl font-black uppercase leading-none text-transparent">Preview de perfil sonoro</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareOpen(false)}
                className="rounded-md border-2 border-white/35 px-2 py-1 text-xs font-black uppercase hover:bg-white/15"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 rounded-[18px] border-2 border-[#00f0ff]/25 bg-[#121a40]/85 p-3">
              <div className="flex items-center gap-3">
                <div className="relative h-20 w-20 overflow-hidden rounded-[14px] border-2 border-white/30">
                  <Image
                    src={`/images/characters/${sonicPersona.assetFile}`}
                    alt={`${sonicPersona.name} avatar`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7be3ff]">Avatar</p>
                  <p className="font-sonic-persona text-2xl leading-none">{sonicPersona.name}</p>
                  <p className="mt-1 text-sm font-bold">{shareCopy.headline}</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-[#d8ebff]">{shareDescription}</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-black uppercase tracking-wide">
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#2d3d7f] bg-[#4968bb] px-3 py-2 text-[#f8eecf] hover:brightness-110"
              >
                <Share2 className="h-4 w-4" />
                Share nativo
              </button>
              <button
                type="button"
                onClick={handleCopyShare}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/35 bg-white/15 px-3 py-2 text-[#eaf7ff] hover:brightness-105"
              >
                <Copy className="h-4 w-4" />
                Copiar link
              </button>
              <button
                type="button"
                onClick={() => shareToNetwork("x")}
                className="rounded-xl border-2 border-white/35 bg-white/10 px-3 py-2 text-[#eaf7ff] hover:brightness-105"
              >
                Compartir en X
              </button>
              <button
                type="button"
                onClick={() => shareToNetwork("whatsapp")}
                className="rounded-xl border-2 border-white/35 bg-white/10 px-3 py-2 text-[#eaf7ff] hover:brightness-105"
              >
                Compartir en WhatsApp
              </button>
              <button
                type="button"
                onClick={() => shareToNetwork("telegram")}
                className="rounded-xl border-2 border-white/35 bg-white/10 px-3 py-2 text-[#eaf7ff] hover:brightness-105"
              >
                Compartir en Telegram
              </button>
              <button
                type="button"
                onClick={() => shareToNetwork("facebook")}
                className="rounded-xl border-2 border-white/35 bg-white/10 px-3 py-2 text-[#eaf7ff] hover:brightness-105"
              >
                Compartir en Facebook
              </button>
            </div>

            {shareFeedback && (
              <p className="mt-3 rounded-lg border border-white/25 bg-white/15 px-3 py-2 text-xs font-bold text-[#eaf7ff]">
                {shareFeedback}
              </p>
            )}
          </div>
        </section>
      )}

      {(profileError || regenerateError) && (
        <section className="relative z-10 mx-auto mt-4 w-[min(94%,640px)] rounded-xl border-2 border-[#ff6c7b]/45 bg-[#2a0e19]/80 px-4 py-2 text-sm font-bold text-[#ffd6dd]">
          {regenerateError ?? profileError}
        </section>
      )}
    </main>
  )
}
