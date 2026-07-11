"use client"

import { Check } from "lucide-react"
import { motion } from "framer-motion"

export function VoteSavedFeedback() {
  return (
    <motion.section
      className="pointer-events-none fixed inset-0 z-60 flex items-center justify-center bg-black/28 px-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <motion.div
        role="status"
        aria-live="polite"
        className="flex w-full max-w-105 items-center justify-center gap-4 rounded-3xl border-2 border-[#00ff9f]/65 bg-[#06110f]/96 px-5 py-4 text-white shadow-[0_0_48px_rgba(0,255,159,0.32),0_18px_50px_rgba(0,0,0,0.55)]"
        initial={{ opacity: 0, y: 16, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.96 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#00ff9f]/70 bg-[#00ff9f]/18 text-[#8fffd3] shadow-[0_0_22px_rgba(0,255,159,0.28)]">
          <Check className="h-5 w-5" />
        </span>
        <div>
          <p className="text-base font-black uppercase tracking-[0.12em] text-[#f3fff8]">¡Voto guardado!</p>
          <p className="text-sm font-semibold text-[#aefbd8]">Preparando el proximo versus...</p>
        </div>
      </motion.div>
    </motion.section>
  )
}
