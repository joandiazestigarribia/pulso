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
      className="fixed left-1/2 top-20 z-50 w-[min(94vw,720px)] -translate-x-1/2 rounded-[26px] border-2 border-[#ffe600]/45 bg-[#0f1638]/92 p-4 text-white shadow-[0_0_38px_rgba(255,230,0,0.22)] backdrop-blur"
      initial={{ opacity: 0, y: -18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -18, scale: 0.96 }}
    >
      <div className="mb-3 flex items-center justify-center gap-2">
        <span className="rounded-xl border border-[#00f0ff]/55 bg-[#00f0ff]/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#8ff7ff]">
          Voto guardado
        </span>
        <span className="rounded-xl border border-[#ff43f8]/55 bg-[#ff43f8]/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#ffc2fd]">
          ELO actualizado
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[#00f0ff]/45 bg-[#001f2d]/56 p-3 shadow-[0_0_22px_rgba(0,240,255,0.16)]">
          <p className="truncate text-sm font-black uppercase tracking-[0.06em] text-[#d9f8ff]">{winner.name}</p>
          <p className="font-mono text-xs text-[#b6d7e5]">Nuevo ELO: {winner.newElo}</p>
          <p className="font-mono text-sm font-black text-[#7be3ff]">
            {formatEloChange(winner.eloChange)} puntos
          </p>
        </div>

        <div className="rounded-2xl border border-[#ff5ca8]/45 bg-[#2f1024]/56 p-3 shadow-[0_0_22px_rgba(255,67,248,0.16)]">
          <p className="truncate text-sm font-black uppercase tracking-[0.06em] text-[#ffd9f4]">{loser.name}</p>
          <p className="font-mono text-xs text-[#e5c4dd]">Nuevo ELO: {loser.newElo}</p>
          <p className="font-mono text-sm font-black text-[#ff9ed8]">
            {formatEloChange(loser.eloChange)} puntos
          </p>
        </div>
      </div>
    </motion.div>
  )
}
