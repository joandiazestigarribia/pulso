"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((response) => response.json())

interface BattleStatsResponse {
  completedBattlesCount: number
}

interface IdentitySessionResponse {
  isAuthenticated: boolean
  userId: string | null
  anonymousId: string | null
  spotifyConnected: boolean
  spotifyTokenError: string | null
}

export default function FullProfilePage() {
  const [isExportTesting, setIsExportTesting] = useState(false)
  const [exportResult, setExportResult] = useState<{
    status: number
    code?: string
    message?: string
    ok?: boolean
  } | null>(null)

  const { data: stats } = useSWR<BattleStatsResponse>("/api/battle/stats", fetcher, {
    revalidateOnFocus: false,
  })

  const { data: session } = useSWR<IdentitySessionResponse>("/api/identity/session", fetcher, {
    revalidateOnFocus: false,
  })

  const handleTestExportGate = async () => {
    if (isExportTesting) {
      return
    }

    setIsExportTesting(true)
    setExportResult(null)

    try {
      const response = await fetch("/api/export", {
        method: "POST",
      })

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        code?: string
        message?: string
      }

      setExportResult({
        status: response.status,
        ok: payload.ok,
        code: payload.code,
        message: payload.message,
      })
    } catch {
      setExportResult({
        status: 0,
        code: "NETWORK_ERROR",
        message: "Network error while calling /api/export.",
      })
    } finally {
      setIsExportTesting(false)
    }
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 pb-10 pt-20">
      <section className="rounded-3xl border border-campfire-purple/30 bg-carbon-light/80 p-6">
        <h1 className="font-mono text-2xl font-black uppercase tracking-wide text-foreground">
          Music DNA Full View
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Auth-gated profile view for synchronized progress and future export actions.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-carbon-lighter/50 p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">User</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{session?.userId ?? "Unknown"}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-carbon-lighter/50 p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
              Completed Battles
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {stats?.completedBattlesCount ?? 0}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-carbon-lighter/50 p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
              Spotify Connected
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {session?.spotifyConnected ? "Yes" : "No"}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-carbon-lighter/50 p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
              Token Health
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {session?.spotifyTokenError ? session.spotifyTokenError : "ok"}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-campfire-purple/30 bg-carbon-light/80 p-6">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-campfire-purple">
          Export Gate Check
        </h2>
        <p className="mt-2 text-sm text-foreground/70">
          `POST /api/export` is protected and requires valid Spotify-authenticated session.
        </p>
        <button
          type="button"
          onClick={handleTestExportGate}
          disabled={isExportTesting}
          className="mt-4 rounded-xl border border-campfire-purple/40 bg-carbon-lighter/70 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-carbon-lighter disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExportTesting ? "Testing..." : "Test Export Gate (POST)"}
        </button>

        {exportResult && (
          <div className="mt-3 rounded-xl border border-white/10 bg-carbon-lighter/40 p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
              Last response
            </div>
            <div className="mt-1 text-xs text-foreground">
              Status: {exportResult.status} {exportResult.ok ? "(ok)" : "(error)"}
            </div>
            {exportResult.code && <div className="text-xs text-foreground/80">Code: {exportResult.code}</div>}
            {exportResult.message && (
              <div className="mt-1 text-xs text-foreground/70">{exportResult.message}</div>
            )}
          </div>
        )}
      </section>

      <div className="flex gap-3">
        <Link
          href="/profile"
          className="rounded-xl border border-white/20 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-foreground hover:bg-carbon-lighter/70"
        >
          Back to Profile
        </Link>
        <Link
          href="/battle"
          className="rounded-xl bg-neon-green px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-carbon"
        >
          Go to Battle
        </Link>
      </div>
    </main>
  )
}
