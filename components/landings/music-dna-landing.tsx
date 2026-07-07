"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Megaphone, RefreshCcw } from "lucide-react"
import { motion } from "framer-motion"
import { BattleResetConfirmModal } from "@/components/landings/battle/battle-ui-blocks"
import { RadarChart } from "@/components/landings/music-dna/radar-chart"
import { ProfileMetricsPanel } from "@/components/landings/music-dna/profile-metrics-panel"
import { WoodActionButton } from "@/components/landings/wood-action-button"
import { MusicDnaShareModal } from "@/components/landings/music-dna/music-dna-share-modal"
import { useMusicDnaViewModel } from "@/components/landings/music-dna/use-music-dna-view-model"
import { MUSIC_DNA_UNLOCK_THRESHOLD } from "@/lib/music-dna-config"

const PROFILE_ACCESS_MIN_BATTLES = MUSIC_DNA_UNLOCK_THRESHOLD

const musicDnaBackgroundStyle = {
  backgroundImage: "url('/images/music-dna/background-music-dna.png')",
  backgroundPosition: "center",
  backgroundSize: "auto",
} as const

export function MusicDnaLanding() {
  const {
    isLoading,
    profileError,
    resetError,
    isResetting,
    isShareOpen,
    shareFeedback,
    dominantGenres,
    sonicPersona,
    sonicPersonaDisplayName,
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
    handleResetProgress,
    handleCopyShare,
    shareToNetwork,
  } = useMusicDnaViewModel()
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

  useEffect(() => {
    if (!isResetting) {
      return
    }

    setIsResetConfirmOpen(false)
  }, [isResetting])

  if (isLoading) {
    return (
      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center overflow-hidden px-4 pb-8 pt-24">
        <div className="pointer-events-none fixed inset-0 z-0 opacity-90" style={musicDnaBackgroundStyle} />
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.14),transparent_45%),radial-gradient(circle_at_75%_15%,rgba(255,67,248,0.2),transparent_45%),linear-gradient(180deg,rgba(8,11,26,0.74),rgba(8,11,26,0.92))]" />
        <motion.div
          className="relative z-10 flex items-center gap-3 rounded-2xl border-2 border-[#00f0ff]/40 bg-[#120a26]/80 px-5 py-3 text-sm font-bold text-[#eaf7ff]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <motion.span
            className="h-4 w-4 rounded-full border-2 border-[#00f0ff]/45 border-t-[#00f0ff]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          Cargando análisis...
        </motion.div>
      </main>
    )
  }

  if (totalBattles < PROFILE_ACCESS_MIN_BATTLES) {
    const remainingBattles = PROFILE_ACCESS_MIN_BATTLES - totalBattles

    return (
      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center overflow-hidden px-4 pb-8 pt-24">
        <div className="pointer-events-none fixed inset-0 z-0 opacity-90" style={musicDnaBackgroundStyle} />
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.14),transparent_45%),radial-gradient(circle_at_75%_15%,rgba(255,67,248,0.2),transparent_45%),linear-gradient(180deg,rgba(8,11,26,0.74),rgba(8,11,26,0.92))]" />
        <motion.section
          className="relative z-10 w-full max-w-lg rounded-3xl border border-[#00f0ff]/35 bg-[#0b1230]/78 px-6 py-7 text-center shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7be3ff]">Perfil Sonoro Bloqueado</p>
          <h1 className="mt-2 bg-linear-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-xl font-black uppercase leading-tight tracking-tight text-transparent">
            Seguí votando para acceder
          </h1>
          <p className="mt-3 text-sm font-semibold text-[#d8e9ff]">
            Necesitás {PROFILE_ACCESS_MIN_BATTLES} batallas votadas para desbloquear esta sección.
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#82dff2]">
            ¡Te faltan {remainingBattles} para obtener tu Perfil Sonoro!
          </p>
        </motion.section>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#080b1a] pb-8 pt-15 text-[#eaf7ff] md:px-4">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-90" style={musicDnaBackgroundStyle} />
      <motion.section
        className="relative z-10 mx-auto mt-5 max-w-300 overflow-hidden rounded-[28px] bg-[#090d25]/45 text-[#eaf7ff] backdrop-blur-sm"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="pointer-events-none absolute inset-0" />
        <div className="relative grid gap-4 px-3 pt-0 md:grid-cols-[350px_minmax(0,1fr)]">
          <aside className="relative overflow-hidden px-3 pb-3 pt-5">
            <motion.div
              className="mx-auto max-w-77.5 rounded-3xl border border-white/25 bg-black/40 px-4 py-4 text-center shadow-[0_0_32px_rgba(0,240,255,0.18)]"
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7be3ff]">Pulso Experience</p>
              <p className="mt-2 bg-linear-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text font-sonic-persona text-4xl font-black uppercase leading-[0.95] tracking-tight text-transparent">
                Campground
              </p>
            </motion.div>

            <motion.div
              className="relative mx-auto mt-4 flex w-full max-w-53.5 justify-center"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1, y: [0, -3, 0] }}
              transition={{
                opacity: { duration: 0.35, ease: "easeOut" },
                scale: { duration: 0.35, ease: "easeOut" },
                y: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
              }}
            >
              <Image
                src={`/images/characters/${sonicPersona.assetFile}`}
                alt={`${sonicPersonaDisplayName} avatar`}
                width={190}
                height={220}
                className="h-auto w-full rounded-[12px] object-cover drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]"
                priority
              />
            </motion.div>

            <div className="relative px-1">
              <motion.div
                className="mx-auto mt-3 w-full rounded-2xl border border-[#ff43f8]/35 bg-[#121a40]/72 px-3 py-3 text-center shadow-[inset_0_0_0_1px_rgba(0,240,255,0.14)]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.25, ease: "easeOut" }}
              >
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7be3ff]">Perfil Sonoro</p>
                <p className="mt-1 bg-linear-to-r from-[#ff43f8] via-[#ffe600] to-[#00f0ff] bg-clip-text font-sonic-persona text-[28px] font-black uppercase leading-none text-transparent">
                  {sonicPersonaDisplayName}
                </p>
              </motion.div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <motion.article
                className="mx-auto w-full max-w-38 rounded-[22px] border border-[#00f0ff]/40 bg-[#10183b]/78 px-2 py-3 text-center shadow-[0_10px_18px_rgba(0,0,0,0.28)]"
                whileHover={{ y: -2, scale: 1.01 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <p className="mx-auto w-[70%] text-[11px] font-black uppercase leading-normal tracking-wide text-[#7be3ff]">
                  Batallas totales
                </p>
                <p className="mt-1 text-[44px] font-black leading-[0.8] text-[#eaf7ff]">{totalBattles}</p>
              </motion.article>
              <motion.article
                className="mx-auto w-full max-w-38 rounded-[22px] border border-[#ff43f8]/40 bg-[#151339]/78 px-2 py-3 text-center shadow-[0_10px_18px_rgba(0,0,0,0.28)]"
                whileHover={{ y: -2, scale: 1.01 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <p className="mx-auto w-[70%] text-[11px] font-black uppercase leading-normal tracking-wide text-[#ffb5fb]">
                  Votos analizados
                </p>
                <p className="mt-1 text-[44px] font-black leading-[0.8] text-[#eaf7ff]">{analyzedVotes}</p>
              </motion.article>
            </div>
          </aside>

          <div className="grid gap-3 py-5 md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            <motion.section
              className="rounded-[34px_22px_30px_20px] bg-[#0d1232]/72 p-4 shadow-[0_14px_38px_rgba(0,0,0,0.35)] backdrop-blur-sm md:p-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.35, ease: "easeOut" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-[#00f0ff]/25 pb-3">
                <div>
                  <h1 className="bg-linear-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-4xl font-black uppercase leading-none tracking-tight text-transparent md:text-5xl">
                    Tu huella auditiva
                  </h1>
                  <p className="mt-2 text-sm font-semibold text-[#d8e9ff] md:text-base">
                    En base a tus {analyzedVotes} canciones votadas.
                  </p>
                </div>
              </div>

              <motion.div
                className="mt-4 rounded-[24px_18px_22px_16px] border border-[#ff43f8]/25 bg-[#121a40]/74 p-4 shadow-[inset_0_0_0_1px_rgba(0,240,255,0.15),0_12px_24px_rgba(0,0,0,0.28)]"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7be3ff]">Perfil Sonoro</p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-[#eaf7ff]">{shareDescription}</p>
              </motion.div>

              <motion.div
                className="relative mt-6 px-3 py-3 text-left"
                whileHover={{ y: -1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <p className="border-b border-[#00f0ff]/20 pb-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#7be3ff]">
                  Radar Sonoro
                </p>
                <div className="mt-2 rounded-2xl bg-black/18 p-2">
                  <RadarChart axes={radarAxes} />
                </div>
              </motion.div>
            </motion.section>

            <motion.aside
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35, ease: "easeOut" }}
            >
              <motion.section
                className="rounded-[30px_16px_24px_14px] bg-[#111739]/74 p-3 shadow-[0_10px_18px_rgba(0,0,0,0.28)] ring-1 ring-[#00f0ff]/20"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="bg-linear-to-r from-[#00f0ff] to-[#ff43f8] bg-clip-text text-2xl font-black uppercase tracking-tight text-transparent">
                    Géneros dominantes
                  </h2>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(dominantGenres.length > 0 ? dominantGenres : ["Formato Abierto"]).map((genre, index) => (
                    <motion.span
                      key={genre}
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${
                        index % 2 === 0
                          ? "bg-[#ff43f8]/25 text-[#ffd8ff] ring-[#ff43f8]/45"
                          : "bg-[#00f0ff]/22 text-[#d7faff] ring-[#00f0ff]/45"
                      }`}
                      whileHover={{ scale: 1.04 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      {genre}
                    </motion.span>
                  ))}
                </div>
              </motion.section>

              <ProfileMetricsPanel
                intensityScore={intensityScore}
                rhythmScore={rhythmScore}
                danceScore={danceScore}
                explorationScore={explorationScore}
              />

              <motion.article className="mb-4" whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: "easeOut" }}>
                <p className="mb-2 mt-4 px-1 text-xs font-black uppercase tracking-[0.08em] text-[#d8ebff]">
                  ¡Compartí tu perfil sonoro con tus amigos!
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
              </motion.article>

              <motion.article whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: "easeOut" }}>
                <p className="mb-2 px-1 text-xs font-black uppercase tracking-[0.08em] text-[#d8ebff]">
                  Reiniciá tu perfil sonoro y empezá de nuevo
                </p>
                <WoodActionButton
                  onClick={() => setIsResetConfirmOpen(true)}
                  disabled={isResetting}
                  variant="neonGreen"
                  icon={<RefreshCcw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />}
                >
                  {isResetting ? "Reiniciando..." : "Reiniciar"}
                </WoodActionButton>
              </motion.article>
            </motion.aside>
          </div>
        </div>
      </motion.section>

      <MusicDnaShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        personaName={sonicPersonaDisplayName}
        personaAssetFile={sonicPersona.assetFile}
        description={shareDescription}
        feedback={shareFeedback}
        onCopyShare={handleCopyShare}
        onShareToNetwork={shareToNetwork}
      />

      <BattleResetConfirmModal
        isOpen={isResetConfirmOpen}
        isResetting={isResetting}
        onCancel={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetProgress}
      />

      {(profileError || resetError) ? (
        <section className="relative z-10 mx-auto mt-4 w-[min(94%,640px)] rounded-xl border-2 border-[#ff6c7b]/45 bg-[#2a0e19]/80 px-4 py-2 text-sm font-bold text-[#ffd6dd]">
          {resetError ?? profileError}
        </section>
      ) : null}
    </main>
  )
}
