"use client"

import { motion } from "framer-motion"

export function TacticalFooter() {
  return (
    <motion.footer
      className="text-center pb-6 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <div className="flex items-center justify-center gap-6 mb-3">
        <div className="text-center">
          <span className="block font-mono text-lg font-bold text-neon-green text-glow-green">
            12.5K+
          </span>
          <span className="block font-mono text-[10px] tracking-widest uppercase text-foreground/60">
            Voters
          </span>
        </div>
        <div className="w-px h-8 bg-carbon-lighter" />
        <div className="text-center">
          <span className="block font-mono text-lg font-bold text-neon-green text-glow-green">
            842
          </span>
          <span className="block font-mono text-[10px] tracking-widest uppercase text-foreground/60">
            Duels Live
          </span>
        </div>
      </div>
      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-foreground/30">
        Built for the sound-obsessed // v.2.0.4-fest
      </p>
    </motion.footer>
  )
}
