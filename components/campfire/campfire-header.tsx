"use client"

import { Home, User as UserIcon } from "lucide-react"

export function CampfireHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 py-3 bg-campfire-deep/80 backdrop-blur-md border-b border-campfire-purple/20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-campfire-orange flex items-center justify-center">
          <Home className="w-4 h-4 text-white" />
        </div>
        <span className="font-mono text-sm font-bold tracking-wider text-foreground uppercase hidden sm:block">
          Neon Campfire
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="font-mono text-[10px] tracking-wider uppercase text-campfire-orange">
            Next Reward
          </span>
          <span className="font-sans text-xs text-foreground/80">Synthwave Sorcerer</span>
        </div>

        <div className="flex items-center gap-2 bg-carbon-lighter/60 border border-carbon-lighter rounded-full px-3 py-1.5">
          <span className="font-mono text-xs font-bold text-foreground">LVL 5</span>
          <div className="w-16 h-1.5 bg-carbon rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-campfire-lime to-neon-green"
              style={{ width: "46%" }}
            />
          </div>
          <span className="font-mono text-[10px] text-foreground/60">460/1000</span>
        </div>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-campfire-pink to-campfire-purple flex items-center justify-center border-2 border-campfire-purple/50">
          <UserIcon className="w-4 h-4 text-white" />
        </div>
      </div>
    </header>
  )
}
