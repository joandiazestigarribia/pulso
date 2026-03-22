"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { AnimatePresence, motion } from "framer-motion"
import { Flame, Play, RefreshCcw, Square, Volume2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { EloFeedback } from "@/components/landings/elo-feedback"
import type { Battle, Track } from "@/lib/mock-data"
import { resolveConversionExperiment } from "@/lib/conversion-experiments"
import { trackClientEvent } from "@/lib/client-events"
import { MUSIC_DNA_UNLOCK_THRESHOLD } from "@/lib/music-dna-config"

function isBattle(value: unknown): value is Battle {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<Battle>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.userId === "string" &&
    candidate.trackA !== undefined &&
    candidate.trackB !== undefined
  )
}

const fetcher = async (url: string): Promise<Battle> => {
  const response = await fetch(url)
  const payload: unknown = await response.json()

  if (!response.ok) {
    const message =
      payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : "Unable to fetch battle"
    throw new Error(message)
  }

  if (!isBattle(payload)) {
    throw new Error("Unable to fetch battle")
  }

  return payload
}

const jsonFetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Unable to fetch resource")
  }

  return (await response.json()) as T
}

function formatAudioTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "0:00"
  }

  const totalSeconds = Math.floor(value)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

interface VoteTrackResult {
  id: string
  name: string
  newElo: number
  eloChange: number
}

interface VoteResponse {
  winner: VoteTrackResult
  loser: VoteTrackResult
}

interface BattleStatsResponse {
  completedBattlesCount: number
}

interface BattleResetResponse {
  ok: boolean
  code?: string
  message?: string
  data?: {
    deletedBattles: number
  }
}

interface AuthSessionResponse {
  isAuthenticated: boolean
  userId: string | null
  anonymousId: string | null
  spotifyConnected: boolean
  spotifyTokenError: string | null
}

interface BattleSideProps {
  label: string
  color: string
  titleColor: string
  track: Track
  voteLabel: string
  keyLabel: string
  isVoting: boolean
  result: "winner" | "loser" | null
  activePreviewTrackId: string | null
  onPreviewEnded: (trackId: string) => void
  onTogglePreview: (track: Track) => void
  onVote: () => void
  side: "left" | "right"
}

const battleBackgroundStyle = {
  backgroundImage: "url('/images/battle/neon_campfire_background.png')",
  backgroundPosition: "center",
  backgroundSize: "contain",
} as const

const PROFILE_UI_GOAL_VOTES = 40

function BattleSide({
  label,
  color,
  titleColor,
  track,
  voteLabel,
  keyLabel,
  isVoting,
  result,
  activePreviewTrackId,
  onPreviewEnded,
  onTogglePreview,
  onVote,
  side,
}: BattleSideProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isWinner = result === "winner"
  const isLoser = result === "loser"
  const hasPreview = Boolean(track.previewUrl)
  const isPreviewPlaying = hasPreview && activePreviewTrackId === track.id
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0)
  const [previewDuration, setPreviewDuration] = useState(30)

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    if (!hasPreview) {
      audio.pause()
      audio.currentTime = 0
      setPreviewCurrentTime(0)
      setPreviewDuration(30)
      return
    }

    if (isPreviewPlaying) {
      void audio.play().catch(() => {
        onPreviewEnded(track.id)
      })
      return
    }

    audio.pause()
    audio.currentTime = 0
    setPreviewCurrentTime(0)
  }, [hasPreview, isPreviewPlaying, onPreviewEnded, track.id])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  return (
    <section className="group relative flex flex-1 flex-col items-center justify-center">
      <div
        className={`absolute -top-3 z-20 rounded-xl border-2 border-white/40 bg-black/55 px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow-[0_0_20px_rgba(250,70,255,0.35)] backdrop-blur md:-top-4 md:px-4 md:text-sm ${side === "left" ? "-left-10 -rotate-6 md:-rotate-12" : "-right-10 rotate-6 md:rotate-12"
          }`}
      >
        {label}
      </div>

      <motion.div
        className="w-full max-w-[300px] rounded-[20px] border-2 bg-black/45 p-2.5 shadow-[0_0_22px_rgba(0,0,0,0.5)] backdrop-blur-none md:max-w-[320px] md:rounded-[22px] md:p-2.5"
        style={{ borderColor: color, boxShadow: `0 0 26px ${color}75` }}
        initial={{ opacity: 0, y: 16 }}
        animate={
          isLoser
            ? { opacity: 0.35, y: 0, scale: 0.96, filter: "grayscale(100%)" }
            : isWinner
              ? { opacity: 1, y: 0, scale: [1, 1.03, 1] }
              : { opacity: 1, y: 0, scale: 1 }
        }
        transition={isWinner ? { duration: 0.55 } : { duration: 0.35 }}
      >
        <div className="relative mb-2.5 aspect-[5/4] overflow-hidden rounded-[14px] border-2 border-white/35 md:mb-3 md:rounded-[16px]">
          <Image
            src={track.albumImage}
            alt={`${track.name} cover art`}
            fill
            sizes="(max-width: 1024px) 100vw, 460px"
            className="h-full w-full object-cover transition-all duration-500 group-hover:grayscale-0"
            style={{ filter: isLoser ? "grayscale(100%)" : "grayscale(20%)" }}
            unoptimized
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-0 m-4 flex items-center justify-center rounded-[20px] border border-white/20 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="h-16 w-16 animate-ping rounded-full border border-white/70" />
          </div>
        </div>

        <audio
          key={track.id}
          ref={audioRef}
          preload="none"
          src={track.previewUrl ?? undefined}
          onLoadedMetadata={(event) => {
            const duration = event.currentTarget.duration
            if (Number.isFinite(duration) && duration > 0) {
              setPreviewDuration(duration)
            }
          }}
          onTimeUpdate={(event) => {
            setPreviewCurrentTime(event.currentTarget.currentTime)
          }}
          onEnded={() => onPreviewEnded(track.id)}
        />

        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-black uppercase leading-none tracking-tight text-white md:text-lg" style={{ color: titleColor }}>
                {track.name}
              </h2>
              <p className="text-xs font-semibold text-white/80 md:text-sm">{track.artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTogglePreview(track)}
              disabled={!hasPreview}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-black/45 text-white transition-all hover:border-white/45 hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={hasPreview ? (isPreviewPlaying ? "Stop preview" : "Play preview") : "Preview unavailable"}
            >
              {isPreviewPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            <div className={`min-w-0 flex-1 rounded-lg border px-2 py-1.5 ${isPreviewPlaying ? "border-[#00f0ff]/45 bg-[#00f0ff]/10" : "border-white/20 bg-black/40"}`}>
              <div className="mb-1 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.12em] text-white/75">
                <span>{hasPreview ? (isPreviewPlaying ? "Preview Live" : "Preview Ready") : "No Preview"}</span>
                <span>
                  {formatAudioTime(previewCurrentTime)} / {formatAudioTime(previewDuration)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] transition-all duration-150"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, previewDuration > 0 ? (previewCurrentTime / previewDuration) * 100 : 0)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={onVote}
            disabled={isVoting}
            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_10px_24px_rgba(0,0,0,0.5)] transition-all hover:brightness-110 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
            style={{
              background: `linear-gradient(130deg, ${color}, #ffe600)`,
              borderColor: "#1a1a1a",
            }}
          >
            {voteLabel}
            <span className="rounded-lg bg-black/15 px-2 text-xs">[{keyLabel}]</span>
          </button>
        </div>
      </motion.div>
    </section>
  )
}

export default function BattlePage() {
  const [battleApiUrl, setBattleApiUrl] = useState("/api/battle")

  const { data: battle, error: battleError, mutate } = useSWR<Battle>(battleApiUrl, fetcher, {
    revalidateOnFocus: false,
  })
  const { data: stats, mutate: mutateStats } = useSWR<BattleStatsResponse>("/api/battle/stats", jsonFetcher, {
    revalidateOnFocus: false,
  })
  const { data: session } = useSWR<AuthSessionResponse>("/api/identity/session", jsonFetcher, {
    revalidateOnFocus: false,
  })

  const [isVoting, setIsVoting] = useState(false)
  const [voteResult, setVoteResult] = useState<{ winner: string; loser: string } | null>(null)
  const [battleKey, setBattleKey] = useState(0)
  const [voteFeedback, setVoteFeedback] = useState<{ winner: VoteTrackResult; loser: VoteTrackResult } | null>(
    null
  )
  const [voteError, setVoteError] = useState<string | null>(null)
  const [resetError, setResetError] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [activePreviewTrackId, setActivePreviewTrackId] = useState<string | null>(null)
  const [hasTrackedPromptShown, setHasTrackedPromptShown] = useState(false)
  const [authConfirmation, setAuthConfirmation] = useState<{
    movedBattles: number
  } | null>(null)

  const identitySeed = session?.userId ?? session?.anonymousId ?? "guest"
  const experiment = resolveConversionExperiment(identitySeed)
  const completedBattles = stats?.completedBattlesCount ?? 0
  const isAuthenticated = Boolean(session?.isAuthenticated)
  const shouldShowAuthPrompt = !isAuthenticated && completedBattles >= experiment.votePromptThreshold
  const hasReachedUnlockThreshold = completedBattles >= MUSIC_DNA_UNLOCK_THRESHOLD

  useEffect(() => {
    setActivePreviewTrackId(null)
  }, [battle?.id])

  useEffect(() => {
    const source = new URL(window.location.href).searchParams.get("source")
    const auth = new URL(window.location.href).searchParams.get("auth")
    const mergedBattlesRaw = new URL(window.location.href).searchParams.get("mergedBattles")

    if (!source) {
      if (auth === "done") {
        const movedBattles = Number.parseInt(mergedBattlesRaw ?? "0", 10)
        setAuthConfirmation({
          movedBattles: Number.isFinite(movedBattles) ? Math.max(0, movedBattles) : 0,
        })
      }
      return
    }

    setBattleApiUrl(`/api/battle?source=${encodeURIComponent(source)}`)

    if (auth === "done") {
      const movedBattles = Number.parseInt(mergedBattlesRaw ?? "0", 10)
      setAuthConfirmation({
        movedBattles: Number.isFinite(movedBattles) ? Math.max(0, movedBattles) : 0,
      })
    }
  }, [])

  useEffect(() => {
    if (!shouldShowAuthPrompt || hasTrackedPromptShown || !battle) {
      return
    }

    setHasTrackedPromptShown(true)
    void trackClientEvent({
      eventName: "auth_prompt_shown",
      battleId: battle.id,
      variant: experiment.key,
      metadata: {
        timingVariant: experiment.timingVariant,
        copyVariant: experiment.copyVariant,
        completedBattles,
      },
    })
  }, [battle, completedBattles, experiment, hasTrackedPromptShown, shouldShowAuthPrompt])

  const handleTogglePreview = useCallback((track: Track) => {
    if (!track.previewUrl) {
      return
    }

    setActivePreviewTrackId((prev) => (prev === track.id ? null : track.id))
  }, [])

  const handlePreviewEnded = useCallback((trackId: string) => {
    setActivePreviewTrackId((prev) => (prev === trackId ? null : prev))
  }, [])

  const handleVote = useCallback(
    async (winnerId: string) => {
      if (isVoting || !battle) {
        return
      }

      setVoteError(null)
      setIsVoting(true)
      setActivePreviewTrackId(null)

      const loserId = winnerId === battle.trackA.id ? battle.trackB.id : battle.trackA.id
      setVoteResult({ winner: winnerId, loser: loserId })

      try {
        const response = await fetch("/api/battle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ battleId: battle.id, winnerId, loserId, userId: battle.userId }),
        })

        const result = (await response.json()) as VoteResponse | { error: string }

        if (!response.ok || !("winner" in result) || !("loser" in result)) {
          setVoteError("Could not save your vote. Please try again.")
          setVoteResult(null)
          setIsVoting(false)
          return
        }

        setVoteFeedback({
          winner: result.winner,
          loser: result.loser,
        })
      } catch {
        setVoteError("Network error while saving your vote.")
        setVoteResult(null)
        setIsVoting(false)
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 1400))

      setVoteResult(null)
      setVoteFeedback(null)
      setIsVoting(false)
      setBattleKey((prev) => prev + 1)
      await Promise.all([mutate(), mutateStats()])
    },
    [battle, isVoting, mutate, mutateStats]
  )

  const handleResetProgress = useCallback(async () => {
    if (isResetting) {
      return
    }

    const confirmed = window.confirm(
      "Esto reiniciara tus battles votadas y tu progreso de Music DNA. Queres continuar?"
    )
    if (!confirmed) {
      return
    }

    setIsResetting(true)
    setResetError(null)
    setVoteError(null)
    setVoteFeedback(null)
    setVoteResult(null)
    setActivePreviewTrackId(null)

    try {
      const response = await fetch("/api/battle/reset", {
        method: "POST",
      })

      const payload = (await response.json().catch(() => ({}))) as BattleResetResponse
      if (!response.ok || payload.ok === false) {
        setResetError(payload.message ?? "No se pudo reiniciar el progreso.")
        return
      }

      await Promise.all([mutateStats(), mutate()])
      setBattleKey((prev) => prev + 1)
    } catch {
      setResetError("Error de red al reiniciar progreso.")
    } finally {
      setIsResetting(false)
    }
  }, [isResetting, mutate, mutateStats])

  if (battleError) {
    return (
      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center overflow-hidden px-4 pb-8 pt-24">
        <div className="pointer-events-none fixed inset-0 z-0 opacity-90" style={battleBackgroundStyle} />
        <div className="relative z-10 rounded-2xl border-2 border-[#ff4ef5]/45 bg-[#2a0e19]/80 px-5 py-3 text-sm font-bold text-[#ffd6dd]">
          {battleError instanceof Error
            ? battleError.message
            : "Battle service unavailable. Configure server database (`DATABASE_URL`) and retry."}
        </div>
      </main>
    )
  }

  if (!battle) {
    return (
      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center overflow-hidden px-4 pb-8 pt-24">
        <div className="pointer-events-none fixed inset-0 z-0 opacity-90" style={battleBackgroundStyle} />
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.14),transparent_45%),radial-gradient(circle_at_75%_15%,rgba(255,67,248,0.2),transparent_45%),linear-gradient(180deg,rgba(8,11,26,0.74),rgba(8,11,26,0.92))]" />
        <motion.div className="relative z-10 flex flex-col items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            className="h-10 w-10 rounded-full border-2 border-[#00f0ff]/40 border-t-[#00f0ff]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/80">Loading Battle...</span>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-7xl overflow-hidden px-4 pb-8 pt-24 text-[#eaf7ff] selection:bg-[#ff4ef5] selection:text-black">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-90" style={battleBackgroundStyle} />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.14),transparent_45%),radial-gradient(circle_at_75%_15%,rgba(255,67,248,0.2),transparent_45%),linear-gradient(180deg,rgba(8,11,26,0.74),rgba(8,11,26,0.92))]" />

      <AnimatePresence>
        {voteFeedback && <EloFeedback winner={voteFeedback.winner} loser={voteFeedback.loser} />}
      </AnimatePresence>

      <section className="relative z-10 mx-auto w-full max-w-300 overflow-hidden rounded-[28px]">
        <header className="relative z-20 mx-auto mt-3 flex w-[min(96%,1280px)] items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[#111739]/74 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[linear-gradient(130deg,#ff3de2,#9445ff)] shadow-[0_0_16px_rgba(255,61,226,0.55)]">
              <Flame className="h-4 w-4 text-[#ffe6ff]" />
            </div>
            <p className="text-lg font-black uppercase leading-none tracking-wide text-[#eaf7ff]">Pulso Campfire</p>
          </div>
          <nav className="hidden items-center gap-5 text-xs font-black uppercase tracking-[0.12em] md:flex">
            <Link href="/battle" className="text-[#00f0ff] transition-colors hover:text-[#7afff8]">
              The Arena
            </Link>
            <Link href="/music-dna" className="text-[#ff43f8] transition-colors hover:text-[#ff7ef7]">
              Sonic Persona
            </Link>
            <Link href="/profile" className="text-[#00ff9f] transition-colors hover:text-[#7affc9]">
              Battle History
            </Link>
          </nav>
        </header>

        {(voteError || resetError) && (
          <div className="relative z-20 mx-auto mt-3 w-[min(95%,520px)] rounded-xl border-2 border-[#ff6c7b]/45 bg-[#2a0e19]/80 px-4 py-2 text-sm font-semibold text-[#ffd6dd]">
            {voteError ?? resetError}
          </div>
        )}

        {authConfirmation && (
          <section className="relative z-20 mx-auto mt-3 w-[min(96%,760px)] rounded-2xl border border-[#00f0ff]/30 bg-[#111739]/74 px-4 py-3 text-[#eaf7ff] backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-[#d8ebff]">
                Progress linked successfully.
                {" "}
                {authConfirmation.movedBattles > 0
                  ? `${authConfirmation.movedBattles} battle records were preserved after login.`
                  : "Your current progress is now attached to your account."}
              </p>
              <button
                type="button"
                onClick={() => setAuthConfirmation(null)}
                className="rounded border border-white/35 px-2 py-1 text-xs font-black uppercase tracking-wide text-white hover:bg-white hover:text-black"
              >
                Dismiss
              </button>
            </div>
          </section>
        )}

        {shouldShowAuthPrompt && (
          <section className="relative z-20 mx-auto mt-3 w-[min(96%,760px)] rounded-2xl border border-[#00ff9f]/35 bg-[#111739]/74 px-4 py-3 text-[#eaf7ff] backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#00ff9f]">
                  {hasReachedUnlockThreshold ? "Music DNA unlocked" : "Save your progress"}
                </div>
                <p className="text-sm text-[#d8ebff]">
                  {experiment.copyVariant === "unlock_dna"
                    ? "Sign in now to sync your battle streak and unlock full Music DNA insights."
                    : "Keep battling as guest, then sign in to keep progress across devices and prepare playlist export."}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/profile"
                  className="rounded-lg border border-white/35 bg-black/40 px-3 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-white hover:text-black"
                >
                  View Progress
                </Link>
                <Link
                  href="/login?next=%2Fbattle"
                  className="rounded-lg border border-[#00ff9f]/55 bg-[#00ff9f] px-3 py-2 text-xs font-black uppercase tracking-wide text-black shadow-[0_0_22px_rgba(0,255,159,0.4)] hover:brightness-110"
                >
                  Save With Login
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="relative z-10 mx-auto flex w-[min(96%,1120px)] flex-1 flex-col gap-4 overflow-hidden p-4 md:p-5 lg:gap-4">
        <div className="w-full">
          <div className="mx-auto mb-3 flex w-[min(96%,820px)] flex-col gap-1.5 rounded-2xl border border-white/15 bg-black/45 px-4 py-2.5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-xs font-black uppercase tracking-[0.12em] text-[#00f0ff]">
                {completedBattles}/{PROFILE_UI_GOAL_VOTES} battles votados
              </p>
              {completedBattles >= PROFILE_UI_GOAL_VOTES ? (
                <p className="text-xs font-semibold text-white/85">
                  Llegaste a la cantidad necesaria. Revisa tu perfil sonoro{" "}
                  <Link href="/music-dna" className="font-black text-[#00ff9f] underline underline-offset-2 hover:text-[#7affc9]">
                    aqui
                  </Link>
                  .
                </p>
              ) : (
                <p className="text-xs font-semibold text-white/80">Segui votando para desbloquear tu perfil sonoro.</p>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600]"
                style={{
                  width: `${Math.min(100, (completedBattles / PROFILE_UI_GOAL_VOTES) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={battleKey}
            className="flex w-full flex-col items-center gap-4 lg:flex-row lg:justify-center max-w-200 m-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BattleSide
              label="Track A"
              color="#FF2A6D"
              titleColor="#00F0FF"
              track={battle.trackA}
              voteLabel="Vote Left"
              keyLabel="A"
              isVoting={isVoting}
              result={voteResult ? (voteResult.winner === battle.trackA.id ? "winner" : "loser") : null}
              activePreviewTrackId={activePreviewTrackId}
              onPreviewEnded={handlePreviewEnded}
              onTogglePreview={handleTogglePreview}
              onVote={() => handleVote(battle.trackA.id)}
              side="left"
            />

            <div className="flex w-full flex-row items-center justify-center gap-3 lg:w-28 lg:flex-col lg:gap-4">
              <div className="animate-[floating_3s_ease-in-out_infinite] flex h-20 w-20 rotate-6 items-center justify-center rounded-[28px] border border-[#ffe600]/70 bg-black/60 shadow-[0_0_26px_rgba(255,230,0,0.35)] md:h-24 md:w-24 md:rounded-[32px]">
                <span className="text-3xl font-black uppercase text-[#ffe600] md:text-4xl">VS</span>
              </div>
            </div>

            <BattleSide
              label="Track B"
              color="#00FF66"
              titleColor="#FF2A6D"
              track={battle.trackB}
              voteLabel="Vote Right"
              keyLabel="D"
              isVoting={isVoting}
              result={voteResult ? (voteResult.winner === battle.trackB.id ? "winner" : "loser") : null}
              activePreviewTrackId={activePreviewTrackId}
              onPreviewEnded={handlePreviewEnded}
              onTogglePreview={handleTogglePreview}
              onVote={() => handleVote(battle.trackB.id)}
              side="right"
            />
          </motion.div>
        </AnimatePresence>
        </section>

        <footer className="relative z-20 mx-auto mb-4 flex min-h-16 w-[min(92%,860px)] items-center justify-between gap-3 rounded-[22px] border border-white/20 bg-[#111739]/74 px-3 py-2 shadow-[0_0_28px_rgba(0,0,0,0.5)] backdrop-blur md:mb-6 md:px-4">
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 rotate-3 items-center justify-center rounded-xl border border-[#ff4ef5]/60 bg-black/60 shadow-[0_0_18px_rgba(255,78,245,0.3)]">
            <Volume2 className="h-5 w-5 text-[#ff4ef5]" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00f0ff] md:text-xs">Now Playing</div>
            <div className="text-xs font-semibold text-white md:text-sm">
              {activePreviewTrackId
                ? [battle.trackA, battle.trackB].find((track) => track.id === activePreviewTrackId)?.name ?? "PREVIEW"
                : "Preview Stopped"}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button className="rounded-xl border border-white/30 bg-black/45 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-white hover:text-black">
            SKIP STAGE
          </button>
          <button
            type="button"
            onClick={handleResetProgress}
            disabled={isResetting}
            className="inline-flex items-center gap-2 rounded-xl border border-[#ff806d]/45 bg-[#2f1419]/75 px-3 py-1.5 text-xs font-bold text-[#ffd2c9] transition-all hover:border-[#ff806d]/80 hover:bg-[#3a1820] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
            {isResetting ? "Reiniciando..." : "Reiniciar juego"}
          </button>
        </div>
        </footer>
      </section>
    </main>
  )
}
