"use client"

import { Music } from "lucide-react"

export function TacticalHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-neon-magenta flex items-center justify-center">
          <Music className="w-5 h-5 text-white" />
        </div>
        <span className="font-mono text-sm font-bold tracking-widest text-neon-magenta uppercase">
          Tactical HUD
        </span>
      </div>

      <div className="flex items-center gap-2 bg-carbon-lighter/80 backdrop-blur-sm border border-carbon-lighter rounded-full px-4 py-2">
        <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
        <span className="font-mono text-xs tracking-wider text-foreground uppercase">
          Festival Gates: Open
        </span>
      </div>
    </header>
  )
}
