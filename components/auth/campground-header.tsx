"use client"

import { Flame } from "lucide-react"
import { SignOutButton } from "@/components/auth/sign-out-button"

const NAV_ITEMS = ["THE ARENA", "SONIC PERSONA", "CROWD FAVORITES", "BATTLE HISTORY"] as const

export function CampgroundHeader() {
  return (
    <header className="fixed inset-x-0 top-0 p-0 z-50 bg-[#4b2a1a]"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(18,10,5,0.22) 0%, rgba(18,10,5,0.62) 100%), url('/images/header/top-bar.png')",
        backgroundSize: "120%",
        backgroundPosition: "center",
      }}>
      <div
        className="relative mx-auto flex h-14 max-w-[1200px] items-center gap-4 overflow-hidden rounded-md px-3 md:px-5"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,190,120,0.18),transparent_55%)]" />

        <div className="relative flex min-w-0 items-center gap-2 md:gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7c3aed]/90 ring-1 ring-[#c084fc]/60">
            <Flame className="h-4 w-4 text-[#ffe6ff]" />
          </span>
          <span className="truncate font-mono text-[12px] font-bold uppercase tracking-wider text-[#f6d5b2] md:text-base md:tracking-[0.12em]">
            Pulso Campground
          </span>
        </div>

        <nav className="relative ml-auto hidden items-center gap-2 md:flex lg:gap-3">
          {NAV_ITEMS.map((item) => (
            <span
              key={item}
              className="rounded-md px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f6d5b2]/85 lg:px-3"
            >
              {item}
            </span>
          ))}
        </nav>

        <div className="relative ml-auto md:ml-4">
          <SignOutButton />
        </div>
      </div>
    </header>
  )
}
