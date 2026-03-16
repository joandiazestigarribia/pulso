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
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 pb-8 pt-24">
        <div className="rounded-2xl border-2 border-[#7a4c2a] bg-[#f3dfbf] px-5 py-3 text-sm font-bold text-[#4d2e1c]">
          Cargando analisis...
        </div>
      </main>
    )
  }

  return (
    <main className="w-full pt-15 md:px-4 bg-[#f4e0bf]">
      <section className="relative mx-auto max-w-300 overflow-hidden rounded-[28px] text-[#2a1b14]">
        <div className="pointer-events-none absolute inset-0" />
        <div className="relative grid gap-4 pt-0 px-3 md:grid-cols-[350px_minmax(0,1fr)] md:p-4">
          <aside className="relative overflow-hidden pb-3 px-3">

            <div className="relative mx-auto h-27.5 w-full max-w-77.5">
              <Image
                src="/images/music-dna/poster-wood.png"
                alt="Poster wood title"
                fill
                sizes="310px"
                className=""
                priority
              />
              <div className="absolute inset-0 top-5 flex flex-col items-center justify-center pb-1">
                <p className="font-sonic-persona text-3xl font-black uppercase leading-[0.95] tracking-tight text-[#2f1c12]">Pulso</p>
                <p className="font-sonic-persona mt-1 text-2xl font-black uppercase leading-[0.95] tracking-tight text-[#2f1c12]">Campground</p>
              </div>
            </div>

            <div className="relative mx-auto mt-4 flex w-full max-w-53.5 justify-center rounded-[26px] p-2">
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
              <div className="relative mx-auto h-22 w-full">
                <Image
                  src="/images/music-dna/flag-name-character.png"
                  alt="Sonic persona name plate"
                  fill
                  sizes="260px"
                  className="object-contain"
                  priority
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pb-1">
                  <p className="font-sonic-persona text-[20px] font-semibold uppercase leading-none text-[#3b2418]">
                    {sonicPersona.name}
                  </p>
                </div>
              </div>
            </div>

            

            <div className="mt-4 grid grid-cols-2 gap-3">
              <article className="relative mx-auto aspect-square w-full max-w-38">
                <Image
                  src="/images/music-dna/circle-wood-music-dna.png"
                  alt="Medallon de metrica"
                  fill
                  sizes="152px"
                  className="object-contain"
                />
                <div className="absolute inset-0 -top-2.5 flex flex-col items-center justify-center text-center">
                  <p className="text-[12px] font-black uppercase tracking-wide text-[#4a2a1d] leading-normal w-[60%]">Batallas Totales</p>
                  <p className="mt-1 text-[44px] font-black text-[#3b2418] leading-[0.8]">{totalBattles}</p>
                </div>
              </article>
              <article className="relative mx-auto aspect-square w-full max-w-38">
                <Image
                  src="/images/music-dna/circle-wood-music-dna.png"
                  alt="Medallon de metrica"
                  fill
                  sizes="152px"
                  className="object-contain"
                />
                <div className="absolute inset-0 -top-3.75 flex flex-col items-center justify-center text-center">
                  <p className="text-[12px] font-black uppercase tracking-wide text-[#4a2a1d] leading-normal w-[60%]">Votos Analizados</p>
                  <p className="mt-1 text-[44px] font-black text-[#3b2418] leading-[0.8]">{analyzedVotes}</p>
                </div>
              </article>
            </div>
          </aside>
          <div className="grid gap-3 py-5 md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            <section className="rounded-[34px_22px_30px_20px] bg-[#f6e7ca]/95 p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#9c7049] pb-3">
              <div>
                <h1 className="text-4xl font-black uppercase leading-none tracking-tight md:text-5xl">
                  Tu huella auditiva
                </h1>
                <p className="mt-2 text-sm font-semibold md:text-base">En base a tus ultimas {analyzedVotes} batallas.</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#6f4528]">
                  Cuantas mas battles votes, mayor precision tendra tu Music DNA.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[24px_18px_22px_16px] bg-[#eed5ad] p-4 shadow-[inset_0_0_0_1px_rgba(140,94,55,0.35),0_10px_16px_rgba(140,94,55,0.14)]">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#6f4528]">Perfil Sonoro</p>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#4a2a1d]">
                {shareCopy.description || "Tu seleccion combina energia, ritmo y estilo con una firma sonora unica."}
              </p>
            </div>
            <div className="relative mt-6 px-3 py-3 text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6f4528] border-b-2 border-[#9c7049] pb-3">Brújula Sonora</p>
              <div className="mt-2 rounded-2xl p-2">
                <RadarChart axes={radarAxes} />
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-3">
            <section className="rounded-[30px_16px_24px_14px] bg-[#f0d7b4] p-3 shadow-[0_10px_16px_rgba(125,79,43,0.16)] ring-1 ring-[#7d4f2b]/30">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase tracking-tight">Generos Dominantes</h2>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(dominantGenres.length > 0 ? dominantGenres : ["Formato Abierto"]).map((genre, index) => (
                  <span
                    key={genre}
                    className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${
                      index % 2 === 0 ? "bg-[#e38dde] text-[#351b4a] ring-[#5f3078]/50" : "bg-[#8ad6ef] text-[#103543] ring-[#1c6176]/50"
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
              <p className="mt-4 mb-2 px-1 text-xs font-black uppercase tracking-[0.08em] text-[#2a1b14]">
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
                  icon={<Megaphone className="h-4 w-4" />}
                >
                  Compartir
                </WoodActionButton>
              </div>
            </article>

            <article>
              <p className="mb-2 px-1 text-xs font-black uppercase tracking-[0.08em] text-[#4a2a1d]">
                Reinicia tu perfil sonoro e inicia de nuevo
              </p>
              <div
                className=""
              >
                <WoodActionButton
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
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
          <div className="w-full max-w-140 rounded-3xl border-[3px] border-[#6f4528] bg-[#f6e7ca] p-4 text-[#2a1b14] shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-3 border-b-2 border-[#c7a47e] pb-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6f4528]">Compartir Music DNA</p>
                <h3 className="mt-1 text-2xl font-black uppercase leading-none">Preview de perfil sonoro</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareOpen(false)}
                className="rounded-md border-2 border-[#6f4528]/40 px-2 py-1 text-xs font-black uppercase hover:bg-[#eed5ad]"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4 rounded-[18px] border-2 border-[#c7a47e] bg-[#f9e5c5] p-3">
              <div className="flex items-center gap-3">
                <div className="relative h-20 w-20 overflow-hidden rounded-[14px] border-2 border-[#6f4528]/40">
                  <Image
                    src={`/images/characters/${sonicPersona.assetFile}`}
                    alt={`${sonicPersona.name} avatar`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6f4528]">Avatar</p>
                  <p className="font-sonic-persona text-2xl leading-none">{sonicPersona.name}</p>
                  <p className="mt-1 text-sm font-bold">{shareCopy.headline}</p>
                </div>
              </div>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-[#4a2a1d]">{shareDescription}</p>
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
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#6f4528]/50 bg-[#eed5ad] px-3 py-2 text-[#2f1c12] hover:brightness-105"
              >
                <Copy className="h-4 w-4" />
                Copiar link
              </button>
              <button
                type="button"
                onClick={() => shareToNetwork("x")}
                className="rounded-xl border-2 border-[#6f4528]/50 bg-[#f2dfc1] px-3 py-2 text-[#2f1c12] hover:brightness-105"
              >
                Compartir en X
              </button>
              <button
                type="button"
                onClick={() => shareToNetwork("whatsapp")}
                className="rounded-xl border-2 border-[#6f4528]/50 bg-[#f2dfc1] px-3 py-2 text-[#2f1c12] hover:brightness-105"
              >
                Compartir en WhatsApp
              </button>
              <button
                type="button"
                onClick={() => shareToNetwork("telegram")}
                className="rounded-xl border-2 border-[#6f4528]/50 bg-[#f2dfc1] px-3 py-2 text-[#2f1c12] hover:brightness-105"
              >
                Compartir en Telegram
              </button>
              <button
                type="button"
                onClick={() => shareToNetwork("facebook")}
                className="rounded-xl border-2 border-[#6f4528]/50 bg-[#f2dfc1] px-3 py-2 text-[#2f1c12] hover:brightness-105"
              >
                Compartir en Facebook
              </button>
            </div>

            {shareFeedback && (
              <p className="mt-3 rounded-lg border border-[#6f4528]/30 bg-[#eed5ad] px-3 py-2 text-xs font-bold text-[#4a2a1d]">
                {shareFeedback}
              </p>
            )}
          </div>
        </section>
      )}

      {(profileError || regenerateError) && (
        <section className="mt-4 rounded-xl border-2 border-[#8f3f2b] bg-[#ffd9c9] px-4 py-2 text-sm font-bold text-[#5b2618]">
          {regenerateError ?? profileError}
        </section>
      )}
    </main>
  )
}
