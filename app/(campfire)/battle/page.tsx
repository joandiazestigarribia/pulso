"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { AnimatePresence, motion } from "framer-motion"
import { TrackCard } from "@/components/campfire/track-card"
import { CampfireAnimation } from "@/components/campfire/campfire-animation"
import { AudioPlayer } from "@/components/campfire/audio-player"
import type { Battle } from "@/lib/mock-data"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

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
      <main className="relative z-10 flex items-center justify-center min-h-screen">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-10 h-10 border-2 border-campfire-lime/30 border-t-campfire-lime rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <span className="font-mono text-xs tracking-widest uppercase text-foreground/50">
            Loading Battle...
          </span>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="relative z-10 flex flex-col min-h-screen pt-16 pb-24">
      <AnimatePresence>
        {eloChange && (
          <motion.div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-carbon-light/90 backdrop-blur-xl border border-neon-green/30 rounded-xl px-6 py-3 flex items-center gap-3"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            <span className="font-mono text-xs text-neon-green font-bold">
              +ELO
            </span>
            <span className="font-mono text-xs text-foreground/60">
              Vote recorded!
            </span>
          </motion.div>
        )}
      </AnimatePresence>


      <div className="flex-1 flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={battleKey}
            className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8 w-full max-w-5xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >

            <div className="flex-1 flex justify-center w-full lg:w-auto">
              <TrackCard
                track={battle.trackA}
                side="left"
                onVote={() => handleVote(battle.trackA.id)}
                isVoting={isVoting}
                voteResult={
                  voteResult
                    ? voteResult.winner === battle.trackA.id
                      ? "winner"
                      : "loser"
                    : null
                }
              />
            </div>


            <div className="flex-shrink-0 py-4 lg:py-0">
              <CampfireAnimation />
            </div>


            <div className="flex-1 flex justify-center w-full lg:w-auto">
              <TrackCard
                track={battle.trackB}
                side="right"
                onVote={() => handleVote(battle.trackB.id)}
                isVoting={isVoting}
                voteResult={
                  voteResult
                    ? voteResult.winner === battle.trackB.id
                      ? "winner"
                      : "loser"
                    : null
                }
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>


      <AudioPlayer
        trackName={battle.trackA.name}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
      />
    </main>
  )
}
