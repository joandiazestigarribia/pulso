"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { AnimatePresence, motion } from "framer-motion"
import { PartyPopper, Play, Square, Users, Volume2 } from "lucide-react"
import Image from "next/image"
import { EloFeedback } from "@/components/landings/elo-feedback"
import type { Battle, Track } from "@/lib/mock-data"

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

  if (!response.ok || !isBattle(payload)) {
    throw new Error("Unable to fetch battle")
  }

  return payload
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
        className={`absolute -top-3 z-20 rounded-xl border-4 border-black px-3 py-1 text-xs font-black uppercase tracking-wide text-black shadow-[0_8px_0_0_rgba(0,0,0,0.25)] md:-top-4 md:px-4 md:text-sm ${
          side === "left" ? "-left-1 -rotate-6 md:-left-2 md:-rotate-12" : "-right-1 rotate-6 md:-right-2 md:rotate-12"
        }`}
        style={{ backgroundColor: color }}
      >
        {label}
      </div>

      <motion.div
        className="w-full max-w-[430px] rounded-[28px] border-[4px] border-black bg-[#171717] p-3.5 shadow-[0_8px_0_0_rgba(0,0,0,0.25)] md:max-w-[460px] md:rounded-[32px] md:p-4.5"
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
        <div className="relative mb-3 aspect-[5/4] overflow-hidden rounded-[20px] border-4 border-black md:mb-4 md:rounded-[24px]">
          <Image
            src={track.albumImage}
            alt={`${track.name} cover art`}
            fill
            sizes="(max-width: 1024px) 100vw, 460px"
            className="h-full w-full object-cover transition-all duration-500 group-hover:grayscale-0"
            style={{ filter: isLoser ? "grayscale(100%)" : "grayscale(20%)" }}
            unoptimized
          />
          <div className="pointer-events-none absolute inset-0 m-4 flex items-center justify-center rounded-[20px] border-[6px] border-white/20 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="h-16 w-16 animate-ping rounded-full border-4 border-white/80" />
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

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black uppercase leading-none tracking-tight text-white drop-shadow-[2px_2px_0_rgba(0,0,0,1)] md:text-2xl" style={{ color: titleColor }}>
                {track.name}
              </h2>
              <p className="text-sm font-semibold text-white/80 md:text-base">{track.artist}</p>
            </div>
            <div className="rounded-lg border-2 border-black bg-[#FFE600] px-2 py-1 font-mono text-xs font-bold text-black md:text-sm">
              {track.bpm} BPM
            </div>
          </div>

          <button
            type="button"
            onClick={() => onTogglePreview(track)}
            disabled={!hasPreview}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-black/70 px-3 py-2 text-xs font-black uppercase tracking-[0.15em] text-white transition-all hover:border-white/70 hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 md:py-2.5"
          >
            {isPreviewPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {hasPreview ? (isPreviewPlaying ? "Stop Preview" : "Play Preview") : "Preview Unavailable"}
          </button>

          <div className={`rounded-xl border px-3 py-2 ${isPreviewPlaying ? "border-[#00F0FF]/60 bg-[#00F0FF]/10" : "border-white/10 bg-black/40"}`}>
            <div className="mb-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.15em] text-white/70">
              <span>{hasPreview ? (isPreviewPlaying ? "Preview Live" : "Preview Ready") : "No Preview"}</span>
              <span>
                {formatAudioTime(previewCurrentTime)} / {formatAudioTime(previewDuration)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00F0FF] to-[#FFE600] transition-all duration-150"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, previewDuration > 0 ? (previewCurrentTime / previewDuration) * 100 : 0)
                  )}%`,
                }}
              />
            </div>
          </div>

          <button
            onClick={onVote}
            disabled={isVoting}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-4 border-black bg-[#00F0FF] py-3 text-sm font-black uppercase tracking-[0.18em] text-black shadow-[0_8px_0_0_rgba(0,0,0,0.25)] transition-all hover:brightness-110 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 md:py-3.5 md:text-base"
            style={{ backgroundColor: color }}
          >
            {voteLabel}
            <span className="rounded-lg bg-black/10 px-2 text-xs">[{keyLabel}]</span>
          </button>
        </div>
      </motion.div>
    </section>
  )
}

export default function BattlePage() {
  const { data: battle, error: battleError, mutate } = useSWR<Battle>("/api/battle", fetcher, {
    revalidateOnFocus: false,
  })

  const [isVoting, setIsVoting] = useState(false)
  const [voteResult, setVoteResult] = useState<{ winner: string; loser: string } | null>(null)
  const [battleKey, setBattleKey] = useState(0)
  const [voteFeedback, setVoteFeedback] = useState<{ winner: VoteTrackResult; loser: VoteTrackResult } | null>(
    null
  )
  const [voteError, setVoteError] = useState<string | null>(null)
  const [activePreviewTrackId, setActivePreviewTrackId] = useState<string | null>(null)

  useEffect(() => {
    setActivePreviewTrackId(null)
  }, [battle?.id])

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
      mutate()
    },
    [battle, isVoting, mutate]
  )

  if (battleError) {
    return (
      <main className="relative z-10 flex min-h-screen items-center justify-center bg-black px-4">
        <div className="w-full max-w-xl rounded-lg border border-red-500/40 bg-red-900/20 p-4 text-sm text-red-100">
          Battle service unavailable. Configure server database (`DATABASE_URL`) and retry.
        </div>
      </main>
    )
  }

  if (!battle) {
    return (
      <main className="relative z-10 flex min-h-screen items-center justify-center bg-black">
        <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            className="h-10 w-10 rounded-full border-2 border-[#00F0FF]/40 border-t-[#00F0FF]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">Loading Battle...</span>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="relative z-10 flex min-h-screen flex-col overflow-hidden bg-black pb-32 text-white selection:bg-[#FFE600] selection:text-black">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40">
        <div className="absolute -left-[5%] -top-[10%] h-[40%] w-[40%] rounded-full bg-[#AD00FF] blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[5%] h-[40%] w-[40%] rounded-full bg-[#00F0FF] blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-black to-transparent" />
      </div>

      <AnimatePresence>
        {voteFeedback && <EloFeedback winner={voteFeedback.winner} loser={voteFeedback.loser} />}
      </AnimatePresence>

      <header className="relative z-10 flex min-h-20 flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 -rotate-3 items-center justify-center rounded-2xl border-4 border-black bg-[#FFE600] shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
            <PartyPopper className="h-5 w-5 text-black" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
            Sonic <span className="text-[#00F0FF]">Festival</span>
          </h1>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          <div className="hidden items-center gap-2 rounded-full border-2 border-white/10 bg-black/40 px-4 py-2 backdrop-blur lg:flex">
            <span className="h-3 w-3 animate-pulse rounded-full bg-[#00FF66] shadow-[0_0_10px_#00FF66]" />
            <span className="font-mono text-xs font-bold uppercase tracking-tight">Arena Live</span>
          </div>
          <div className="flex items-center gap-3 rounded-full border-[3px] border-black bg-white px-4 py-1.5 font-bold text-black shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
            <div className="h-8 w-8 rounded-full border-2 border-black bg-[linear-gradient(135deg,#AD00FF,#00F0FF)]" />
            <span className="text-sm">KAI.WAV</span>
            <span className="rounded-md bg-[#AD00FF] px-2 py-0.5 text-[10px] uppercase text-white">LVL 14</span>
          </div>
        </div>
      </header>

      {voteError && (
        <div className="relative z-20 mx-auto mt-2 w-[min(95%,520px)] rounded-lg border border-red-500/40 bg-red-900/30 px-4 py-2 text-sm text-red-100">
          {voteError}
        </div>
      )}

      <section className="relative z-10 flex flex-1 flex-col gap-4 overflow-hidden p-4 md:p-6 lg:flex-row lg:gap-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={battleKey}
            className="flex w-full flex-col items-center gap-6 lg:flex-row"
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

            <div className="flex w-full flex-row items-center justify-center gap-3 lg:w-32 lg:flex-col lg:gap-6">
              <div className="animate-[floating_3s_ease-in-out_infinite] flex h-20 w-20 rotate-12 items-center justify-center rounded-[28px] border-4 border-black bg-[#AD00FF] shadow-[0_8px_0_0_rgba(0,0,0,0.25)] md:h-24 md:w-24 md:rounded-[32px]">
                <span className="text-3xl font-black uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,1)] md:text-4xl">VS</span>
              </div>
              <div className="rounded-2xl border-4 border-black bg-white px-4 py-2 text-center text-black shadow-[0_8px_0_0_rgba(0,0,0,0.25)] md:px-6 md:py-3">
                <div className="mb-1 text-[10px] leading-none">LIVE</div>
                <div className="text-3xl leading-none">NOW</div>
              </div>
              <div className="hidden h-24 w-1 rounded-full bg-white/20 lg:block" />
              <div className="hidden flex-col items-center gap-2 lg:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-black bg-[#00FF66] shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
                  <Users className="h-4 w-4 text-black" />
                </div>
                <span className="font-mono text-[10px] font-bold">LIVE VOTING</span>
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

      <footer className="relative z-10 mb-4 flex min-h-20 items-center justify-between gap-4 border-t-4 border-black bg-black/80 px-4 py-3 backdrop-blur-xl md:mb-10 md:h-24 md:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-14 w-14 rotate-3 items-center justify-center rounded-2xl border-4 border-black bg-[#AD00FF] shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
            <Volume2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00F0FF] md:text-xs">Now Playing</div>
            <div className="text-sm font-semibold text-white md:text-base lg:text-lg">
              {activePreviewTrackId
                ? [battle.trackA, battle.trackB].find((track) => track.id === activePreviewTrackId)?.name ?? "PREVIEW"
                : "Preview Stopped"}
            </div>
          </div>
        </div>

        <button className="shrink-0 rounded-xl border-2 border-white/20 bg-black px-4 py-2 text-sm font-bold text-white transition-all hover:bg-white hover:text-black">
          SKIP STAGE
        </button>
      </footer>
    </main>
  )
}
