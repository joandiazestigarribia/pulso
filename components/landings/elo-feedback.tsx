"use client"

import { motion } from "framer-motion"

interface EloResultItem {
  name: string
  newElo: number
  eloChange: number
}

interface EloFeedbackProps {
  winner: EloResultItem
  loser: EloResultItem
}

function formatEloChange(value: number): string {
  if (value > 0) {
    return `+${value}`
  }

  return `${value}`
}

export function EloFeedback({ winner, loser }: EloFeedbackProps) {
  return (
    <motion.div
      className="fixed left-1/2 top-20 z-50 w-[min(92vw,640px)] -translate-x-1/2 rounded-2xl border-2 border-white/20 bg-black/90 p-4 text-white backdrop-blur"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
    >
      <p className="mb-3 text-center font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#00FF66]">
        Vote Saved
      </p>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-xl border border-[#00FF66]/40 bg-[#00FF66]/10 p-3">
          <p className="truncate text-sm font-bold">{winner.name}</p>
          <p className="font-mono text-xs text-white/70">New Elo: {winner.newElo}</p>
          <p className="font-mono text-xs font-black text-[#00FF66]">
            Delta: {formatEloChange(winner.eloChange)}
          </p>
        </div>

        <div className="rounded-xl border border-[#FF2A6D]/40 bg-[#FF2A6D]/10 p-3">
          <p className="truncate text-sm font-bold">{loser.name}</p>
          <p className="font-mono text-xs text-white/70">New Elo: {loser.newElo}</p>
          <p className="font-mono text-xs font-black text-[#FF2A6D]">
            Delta: {formatEloChange(loser.eloChange)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
