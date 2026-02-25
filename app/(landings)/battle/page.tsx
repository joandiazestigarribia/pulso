"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { AnimatePresence, motion } from "framer-motion"
import { PartyPopper, Users, Volume2 } from "lucide-react"
import { AudioPlayer } from "@/components/landings/audio-player"
import type { Battle, Track } from "@/lib/mock-data"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const visualizerDelays = [
  0.1, 0.3, 0.2, 0.5, 0.4, 0.1, 0.6, 0.2, 0.3,
  0.5, 0.1, 0.4, 0.2, 0.6, 0.3, 0.1, 0.5, 0.2,
]

function scoreWidth(track: Track, rival: Track) {
  const total = track.eloScore + rival.eloScore
  const pct = total > 0 ? (track.eloScore / total) * 100 : 50
  return `${Math.min(88, Math.max(12, pct)).toFixed(1)}%`
}

interface BattleSideProps {
  label: string
  color: string
  titleColor: string
  barGradient: string
  track: Track
  rival: Track
  voteLabel: string
  keyLabel: string
  isVoting: boolean
  result: "winner" | "loser" | null
  onVote: () => void
  side: "left" | "right"
}

function BattleSide({
  label,
  color,
  titleColor,
  barGradient,
  track,
  rival,
  voteLabel,
  keyLabel,
  isVoting,
  result,
  onVote,
  side,
}: BattleSideProps) {
  const isWinner = result === "winner"
  const isLoser = result === "loser"

  return (
    <section className="group relative flex flex-1 flex-col items-center justify-center">
      <div
        className={`absolute -top-4 z-20 rounded-xl border-4 border-black px-4 py-1 font-black uppercase tracking-wide text-black shadow-[0_8px_0_0_rgba(0,0,0,0.25)] ${
          side === "left" ? "-left-2 -rotate-12" : "-right-2 rotate-12"
        }`}
        style={{ backgroundColor: color }}
      >
        {label}
      </div>

      <motion.div
        className="w-full max-w-[440px] rounded-[32px] border-[4px] border-black bg-[#171717] p-6 shadow-[0_8px_0_0_rgba(0,0,0,0.25)]"
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
        <div className="relative mb-6 aspect-square overflow-hidden rounded-[24px] border-4 border-black">
          <img
            src={track.albumImage}
            alt={`${track.name} cover art`}
            className="h-full w-full object-cover transition-all duration-500 group-hover:grayscale-0"
            style={{ filter: isLoser ? "grayscale(100%)" : "grayscale(20%)" }}
          />
          <div className="pointer-events-none absolute inset-0 m-4 flex items-center justify-center rounded-[20px] border-[6px] border-white/20 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="h-16 w-16 animate-ping rounded-full border-4 border-white/80" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-black uppercase leading-none tracking-tight text-white drop-shadow-[2px_2px_0_rgba(0,0,0,1)]" style={{ color: titleColor }}>
                {track.name}
              </h2>
              <p className="text-lg font-semibold text-white/80">{track.artist}</p>
            </div>
            <div className="rounded-lg border-2 border-black bg-[#FFE600] px-2 py-1 font-mono text-sm font-bold text-black">
              {track.bpm} BPM
            </div>
          </div>

          <div className="h-6 overflow-hidden rounded-full border-2 border-black bg-black p-1">
            <div className={`h-full rounded-full bg-gradient-to-r ${barGradient}`} style={{ width: scoreWidth(track, rival) }} />
          </div>

          <button
            onClick={onVote}
            disabled={isVoting}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-4 border-black bg-[#00F0FF] py-4 text-xl font-black uppercase tracking-wide text-black shadow-[0_8px_0_0_rgba(0,0,0,0.25)] transition-all hover:brightness-110 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: color }}
          >
            {voteLabel}
            <span className="rounded-lg bg-black/10 px-2 text-sm">[{keyLabel}]</span>
          </button>
        </div>
      </motion.div>
    </section>
  )
}

export default function BattlePage() {
  const { data: battle, mutate } = useSWR<Battle>("/api/battle", fetcher, {
    revalidateOnFocus: false,
  })
  const [isVoting, setIsVoting] = useState(false)
  const [voteResult, setVoteResult] = useState<{ winner: string; loser: string } | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [battleKey, setBattleKey] = useState(0)
  const [eloChange, setEloChange] = useState<{ winner: number; loser: number } | null>(null)

  const handleVote = useCallback(
    async (winnerId: string) => {
      if (isVoting || !battle) return
      setIsVoting(true)

      const loserId = winnerId === battle.trackA.id ? battle.trackB.id : battle.trackA.id
      setVoteResult({ winner: winnerId, loser: loserId })

      try {
        const res = await fetch("/api/battle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ winnerId, loserId }),
        })
        const result = await res.json()
        setEloChange({
          winner: result.winner.newElo,
          loser: result.loser.newElo,
        })
      } catch {
      }

      await new Promise((resolve) => setTimeout(resolve, 1400))

      setVoteResult(null)
      setEloChange(null)
      setIsVoting(false)
      setBattleKey((prev) => prev + 1)
      mutate()
    },
    [isVoting, battle, mutate]
  )

  if (!battle) {
    return (
      <main className="relative z-10 flex min-h-screen items-center justify-center bg-black">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-10 w-10 rounded-full border-2 border-[#00F0FF]/40 border-t-[#00F0FF]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">
            Loading Battle...
          </span>
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
        {eloChange && (
          <motion.div
            className="fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border-2 border-white/20 bg-black/85 px-4 py-2 backdrop-blur"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#00FF66]">Vote saved</span>
            <span className="font-mono text-xs text-white/70">
              New ELO {eloChange.winner} / {eloChange.loser}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative z-10 flex h-20 items-center justify-between px-6 py-4 lg:px-8">
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

      <section className="relative z-10 flex flex-1 flex-col gap-6 overflow-hidden p-6 lg:flex-row">
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
              label="Challenger"
              color="#FF2A6D"
              titleColor="#00F0FF"
              barGradient="from-[#00F0FF] to-[#AD00FF]"
              track={battle.trackA}
              rival={battle.trackB}
              voteLabel="Vote Left"
              keyLabel="A"
              isVoting={isVoting}
              onVote={() => handleVote(battle.trackA.id)}
              result={
                voteResult
                  ? voteResult.winner === battle.trackA.id
                    ? "winner"
                    : "loser"
                  : null
              }
              side="left"
            />

            <div className="flex w-full flex-row items-center justify-center gap-6 lg:w-32 lg:flex-col">
              <div className="floating flex h-24 w-24 rotate-12 items-center justify-center rounded-[32px] border-4 border-black bg-[#AD00FF] shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
                <span className="text-4xl font-black uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">VS</span>
              </div>
              <div className="rounded-2xl border-4 border-black bg-white px-6 py-3 text-center text-black shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
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
              label="Defender"
              color="#00FF66"
              titleColor="#FF2A6D"
              barGradient="from-[#FF2A6D] to-[#AD00FF]"
              track={battle.trackB}
              rival={battle.trackA}
              voteLabel="Vote Right"
              keyLabel="D"
              isVoting={isVoting}
              onVote={() => handleVote(battle.trackB.id)}
              result={
                voteResult
                  ? voteResult.winner === battle.trackB.id
                    ? "winner"
                    : "loser"
                  : null
              }
              side="right"
            />
          </motion.div>
        </AnimatePresence>
      </section>

      <footer className="relative z-10 mb-28 flex justify-between h-24 items-center gap-6 border-t-4 border-black bg-black/80 px-6 backdrop-blur-xl lg:px-8">
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-14 w-14 rotate-3 items-center justify-center rounded-2xl border-4 border-black bg-[#AD00FF] shadow-[0_8px_0_0_rgba(0,0,0,0.25)]">
            <Volume2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#00F0FF]">Now Playing</div>
            <div className="text-sm font-semibold text-white lg:text-lg">FESTIVAL_RADIO.FM</div>
          </div>
        </div>

        <button className="shrink-0 rounded-xl border-2 border-white/20 bg-black px-4 py-2 text-sm font-bold text-white transition-all hover:bg-white hover:text-black">
          SKIP STAGE
        </button>
      </footer>

      <AudioPlayer
        trackName={battle.trackA.name}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
      />

      <style jsx>{`
        .floating {
          animation: floating 3s ease-in-out infinite;
        }

        @keyframes floating {
          0%,
          100% {
            transform: translateY(0) rotate(12deg);
          }
          50% {
            transform: translateY(-10px) rotate(12deg);
          }
        }
      `}</style>
    </main>
  )
}
