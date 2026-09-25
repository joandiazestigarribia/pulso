"use client"

import { useCallback, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { HelpCircle } from "lucide-react"
import { BattleSide } from "@/components/landings/battle/battle-side"
import type { Track } from "@/lib/mock-data"
import {
  GuessHowToPlayModal,
  GuessLeaderboardTable,
  GuessNicknameModal,
  GuessProgressBanner,
} from "@/components/landings/guess/guess-ui-blocks"
import { GuessResultCard } from "@/components/landings/guess/guess-result-card"
import { useCopyFeedback } from "@/components/landings/guess/use-copy-feedback"
import { useGuessFlow } from "@/components/landings/guess/use-guess-flow"

interface GuessPlayScreenProps {
  playlistId: string
  playlistTitle: string
  shareUrl: string
}

export function GuessPlayScreen({ playlistId, playlistTitle, shareUrl }: GuessPlayScreenProps) {
  const { phase, leaderboard, nicknameError, isSubmittingNickname, isAnswering, submitNickname, submitPick } =
    useGuessFlow(playlistId)
  const prefersReducedMotion = useReducedMotion()
  const { copied: isShareUrlCopied, markCopied } = useCopyFeedback()
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [activePreviewTrackId, setActivePreviewTrackId] = useState<string | null>(null)
  const [refreshingPreviewTrackId, setRefreshingPreviewTrackId] = useState<string | null>(null)

  const handleTogglePreview = useCallback((track: Track) => {
    if (!track.previewUrl) {
      return
    }
    setActivePreviewTrackId((prev) => (prev === track.id ? null : track.id))
  }, [])

  const handlePreviewEnded = useCallback((trackId: string) => {
    setActivePreviewTrackId((prev) => (prev === trackId ? null : prev))
  }, [])

  const handlePreviewError = useCallback(async (track: Track) => {
    setRefreshingPreviewTrackId(track.id)
    setActivePreviewTrackId(null)

    try {
      await fetch("/api/battle/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id }),
      })
    } finally {
      setRefreshingPreviewTrackId(null)
    }
  }, [])

  const handleCopyShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard?.writeText(shareUrl)
      markCopied()
    } catch {
      // clipboard unavailable in this browser context; the share link stays in the address bar.
    }
  }, [markCopied, shareUrl])

  if (phase.kind === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <motion.div
          className="h-10 w-10 rounded-full border-2 border-[#00f0ff]/40 border-t-[#00f0ff]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
      </div>
    )
  }

  if (phase.kind === "error") {
    return (
      <div className="mx-auto w-full max-w-130 rounded-2xl border-2 border-[#ff4ef5]/45 bg-[#2a0e19]/80 px-5 py-3 text-center text-sm font-bold text-[#ffd6dd]">
        {phase.message}
      </div>
    )
  }

  if (phase.kind === "needs-nickname") {
    return (
      <GuessNicknameModal
        title={playlistTitle}
        isSubmitting={isSubmittingNickname}
        error={nicknameError}
        onSubmit={submitNickname}
      />
    )
  }

  if (phase.kind === "owner") {
    return (
      <div className="mx-auto w-full max-w-160 space-y-5">
        <div className="rounded-3xl border-2 border-[#00f0ff]/40 bg-[#0f1638]/92 p-6 text-center text-[#eaf7ff]">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7be3ff]">Tu lista</p>
          <h2 className="mt-1 bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-2xl font-black uppercase text-transparent">
            {playlistTitle}
          </h2>
          <p className="mt-3 text-sm font-semibold text-[#d8ebff]">
            Compartí este link con tus amigos para que jueguen y compitan por el primer puesto.
          </p>
          <button
            type="button"
            onClick={() => {
              void handleCopyShareUrl()
            }}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border-2 border-[#1a1a1a] bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_10px_24px_rgba(0,0,0,0.5)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1638]"
          >
            {isShareUrlCopied ? "¡Link copiado!" : "Copiar link para compartir"}
          </button>
        </div>
        <GuessLeaderboardTable entries={leaderboard} />
      </div>
    )
  }

  if (phase.kind === "completed") {
    return (
      <div className="mx-auto w-full max-w-160 space-y-5">
        <GuessResultCard playlistTitle={playlistTitle} summary={phase.summary} shareUrl={shareUrl} />
        <GuessLeaderboardTable entries={leaderboard} highlightNickname={phase.summary.nickname} />
      </div>
    )
  }

  if (phase.kind !== "playing" && phase.kind !== "revealing") {
    return null
  }

  const round = phase.round
  const revealInfo =
    phase.kind === "revealing" ? { correctTrackId: phase.correctTrackId, correct: phase.correct } : null

  return (
    <div className="mx-auto flex w-full max-w-300 flex-col items-center gap-3 md:gap-4">
      <GuessProgressBanner roundIndex={round.roundIndex} totalRounds={round.totalRounds} />

      {revealInfo ? (
        <p
          className={`text-sm font-black uppercase tracking-wide ${
            revealInfo.correct ? "text-[#7bffb0]" : "text-[#ffb5c4]"
          }`}
        >
          {revealInfo.correct ? "¡Acertaste!" : "Esta vez no. Mirá cuál sí estaba en la lista."}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setIsHelpOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#00f0ff]/35 bg-[#00f0ff]/12 px-3 py-1.5 text-xs font-bold text-[#d8ebff] transition-all hover:border-[#00f0ff]/60 hover:bg-[#00f0ff]/18 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
        >
          <HelpCircle className="h-4 w-4" />
          Cómo se juega
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={round.roundIndex}
          className="m-auto flex w-full max-w-200 flex-col items-center gap-3 md:gap-4 lg:flex-row lg:justify-center"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        >
          <BattleSide
            label="Opción A"
            color="#7be3ff"
            track={round.cardA}
            voteLabel="Es de la lista"
            isVoting={isAnswering}
            result={revealInfo ? (round.cardA.id === revealInfo.correctTrackId ? "winner" : "loser") : null}
            activePreviewTrackId={activePreviewTrackId}
            refreshingPreviewTrackId={refreshingPreviewTrackId}
            onPreviewEnded={handlePreviewEnded}
            onPreviewError={handlePreviewError}
            onTogglePreview={handleTogglePreview}
            onVote={() => submitPick(round.cardA.id)}
            side="left"
          />

          <div className="flex w-full flex-row items-center justify-center gap-3 lg:w-28 lg:flex-col lg:gap-4">
            <div className="flex h-16 w-16 rotate-6 items-center justify-center rounded-[24px] border border-[#ffe600]/70 bg-black/60 shadow-[0_0_26px_rgba(255,230,0,0.35)] md:h-24 md:w-24 md:rounded-[32px]">
              <span className="text-xl font-black uppercase text-[#ffe600] md:text-3xl">¿O?</span>
            </div>
          </div>

          <BattleSide
            label="Opción B"
            color="#ffb5fb"
            track={round.cardB}
            voteLabel="Es de la lista"
            isVoting={isAnswering}
            result={revealInfo ? (round.cardB.id === revealInfo.correctTrackId ? "winner" : "loser") : null}
            activePreviewTrackId={activePreviewTrackId}
            refreshingPreviewTrackId={refreshingPreviewTrackId}
            onPreviewEnded={handlePreviewEnded}
            onPreviewError={handlePreviewError}
            onTogglePreview={handleTogglePreview}
            onVote={() => submitPick(round.cardB.id)}
            side="right"
          />
        </motion.div>
      </AnimatePresence>

      <GuessHowToPlayModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  )
}
