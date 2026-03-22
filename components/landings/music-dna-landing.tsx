"use client"

import Image from "next/image"
import { Megaphone, RefreshCcw } from "lucide-react"
import { RadarChart } from "@/components/landings/music-dna/radar-chart"
import { ProfileMetricsPanel } from "@/components/landings/music-dna/profile-metrics-panel"
import { WoodActionButton } from "@/components/landings/wood-action-button"
import { MusicDnaShareModal } from "@/components/landings/music-dna/music-dna-share-modal"
import { useMusicDnaViewModel } from "@/components/landings/music-dna/use-music-dna-view-model"

const musicDnaBackgroundStyle = {
  backgroundImage: "url('/images/music-dna/background-music-dna.png')",
  backgroundPosition: "center",
  backgroundSize: "auto",
} as const

export function MusicDnaLanding() {
  const {
    isLoading,
    profileError,
    regenerateError,
    isRegenerating,
    isShareOpen,
    shareFeedback,
    dominantGenres,
    sonicPersona,
    shareCopy,
    radarAxes,
    intensityScore,
    rhythmScore,
    danceScore,
    explorationScore,
    totalBattles,
    analyzedVotes,
    shareDescription,
    setShareFeedback,
    setIsShareOpen,
    handleRegenerate,
    handleCopyShare,
    handleNativeShare,
    shareToNetwork,
  } = useMusicDnaViewModel()

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
      <section className="relative z-10 mx-auto mt-5 max-w-300 overflow-hidden rounded-[28px] bg-[#090d25]/45 text-[#eaf7ff] backdrop-blur-sm">
        <div className="pointer-events-none absolute inset-0" />
        <div className="relative grid gap-4 px-3 pt-0 md:grid-cols-[350px_minmax(0,1fr)]">
          <aside className="relative overflow-hidden px-3 pb-3 pt-5">
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
                <p className="mx-auto w-[70%] text-[11px] font-black uppercase leading-normal tracking-wide text-[#7be3ff]">
                  Batallas Totales
                </p>
                <p className="mt-1 text-[44px] font-black leading-[0.8] text-[#eaf7ff]">{totalBattles}</p>
              </article>
              <article className="mx-auto w-full max-w-38 rounded-[22px] border border-[#ff43f8]/40 bg-[#151339]/78 px-2 py-3 text-center shadow-[0_10px_18px_rgba(0,0,0,0.28)]">
                <p className="mx-auto w-[70%] text-[11px] font-black uppercase leading-normal tracking-wide text-[#ffb5fb]">
                  Votos Analizados
                </p>
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
                  <p className="mt-2 text-sm font-semibold text-[#d8e9ff] md:text-base">
                    En base a tus ultimas {analyzedVotes} batallas.
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#82dff2]">
                    Cuantas mas canciones votes, mayor precision tendra tu Perfil Sonoro.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[24px_18px_22px_16px] border border-[#ff43f8]/25 bg-[#121a40]/74 p-4 shadow-[inset_0_0_0_1px_rgba(0,240,255,0.15),0_12px_24px_rgba(0,0,0,0.28)]">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7be3ff]">Perfil Sonoro</p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[#eaf7ff]">{shareDescription}</p>
              </div>

              <div className="relative mt-6 px-3 py-3 text-left">
                <p className="border-b border-[#00f0ff]/20 pb-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#7be3ff]">
                  Radar Sonoro
                </p>
                <div className="mt-2 rounded-2xl bg-black/18 p-2">
                  <RadarChart axes={radarAxes} />
                </div>
              </div>
            </section>

            <aside className="flex flex-col gap-3">
              <section className="rounded-[30px_16px_24px_14px] bg-[#111739]/74 p-3 shadow-[0_10px_18px_rgba(0,0,0,0.28)] ring-1 ring-[#00f0ff]/20">
                <div className="flex items-center justify-between">
                  <h2 className="bg-gradient-to-r from-[#00f0ff] to-[#ff43f8] bg-clip-text text-2xl font-black uppercase tracking-tight text-transparent">
                    Generos Dominantes
                  </h2>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(dominantGenres.length > 0 ? dominantGenres : ["Formato Abierto"]).map((genre, index) => (
                    <span
                      key={genre}
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${
                        index % 2 === 0
                          ? "bg-[#ff43f8]/25 text-[#ffd8ff] ring-[#ff43f8]/45"
                          : "bg-[#00f0ff]/22 text-[#d7faff] ring-[#00f0ff]/45"
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
                <p className="mb-2 mt-4 px-1 text-xs font-black uppercase tracking-[0.08em] text-[#d8ebff]">
                  ¡Comparte con tus amigos tu perfil sonoro!
                </p>
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
              </article>

              <article>
                <p className="mb-2 px-1 text-xs font-black uppercase tracking-[0.08em] text-[#d8ebff]">
                  Reinicia tu perfil sonoro e inicia de nuevo
                </p>
                <WoodActionButton
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  variant="neonGreen"
                  icon={<RefreshCcw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />}
                >
                  {isRegenerating ? "Reiniciando..." : "Reiniciar"}
                </WoodActionButton>
              </article>
            </aside>
          </div>
        </div>
      </section>

      <MusicDnaShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        personaName={sonicPersona.name}
        personaAssetFile={sonicPersona.assetFile}
        headline={shareCopy.headline}
        description={shareDescription}
        feedback={shareFeedback}
        onNativeShare={handleNativeShare}
        onCopyShare={handleCopyShare}
        onShareToNetwork={shareToNetwork}
      />

      {(profileError || regenerateError) ? (
        <section className="relative z-10 mx-auto mt-4 w-[min(94%,640px)] rounded-xl border-2 border-[#ff6c7b]/45 bg-[#2a0e19]/80 px-4 py-2 text-sm font-bold text-[#ffd6dd]">
          {regenerateError ?? profileError}
        </section>
      ) : null}
    </main>
  )
}
