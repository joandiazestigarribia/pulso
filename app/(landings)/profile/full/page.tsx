"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((response) => response.json())

interface IdentitySessionResponse {
  isAuthenticated: boolean
  userId: string | null
  anonymousId: string | null
  spotifyConnected: boolean
  spotifyTokenError: string | null
}

interface FullProfileResponse {
  ok: boolean
  code?: string
  message?: string
  data?: {
    unlockThreshold: number
    completedBattlesCount: number
    unlocked: boolean
    profile: {
      summary: string | null
      dominantGenre: string | null
      genreVarietyScore: number
      averageEnergy: number | null
      averageValence: number | null
      averageDanceability: number | null
      decadeDistribution: Record<string, number>
      generatedFromVotes: number
      updatedAt: string
    } | null
    teaser: {
      hint: string
      remainingBattles: number
    }
    error: {
      code: "PROFILE_GENERATION_FAILED"
      message: string
    } | null
  }
}

function formatUnitMetric(value: number | null): string {
  if (value === null) {
    return "N/A"
  }

  return `${Math.round(value * 100)}%`
}

export default function FullProfilePage() {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)

  const { data: session } = useSWR<IdentitySessionResponse>("/api/identity/session", fetcher, {
    revalidateOnFocus: false,
  })

  const {
    data: profileResponse,
    mutate: refreshProfile,
    isLoading,
  } = useSWR<FullProfileResponse>("/api/profile/full", fetcher, {
    revalidateOnFocus: false,
  })

  const profileState = profileResponse?.data
  const profile = profileState?.profile
  const profileError = profileResponse?.ok === false ? profileResponse.message : profileState?.error?.message

  const handleRegenerate = async () => {
    if (isRegenerating) {
      return
    }

    setIsRegenerating(true)
    setRegenerateError(null)

    try {
      const response = await fetch("/api/profile/full", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ forceRegenerate: true }),
      })

      const payload = (await response.json().catch(() => ({}))) as FullProfileResponse
      if (!response.ok || payload.ok === false) {
        setRegenerateError(payload.message ?? "Unable to regenerate Music DNA right now.")
      }

      await refreshProfile()
    } catch {
      setRegenerateError("Network error while regenerating Music DNA.")
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 pb-10 pt-20">
      <section className="rounded-3xl border border-campfire-purple/30 bg-carbon-light/80 p-6">
        <h1 className="font-mono text-2xl font-black uppercase tracking-wide text-foreground">
          Music DNA Full View
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Generated from your completed battles and cached until new votes arrive.
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
              {profileState?.completedBattlesCount ?? 0}
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-campfire-purple">
            Music DNA Persona
          </h2>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="rounded-xl border border-campfire-purple/40 bg-carbon-lighter/70 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-carbon-lighter disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </button>
        </div>

        {isLoading && (
          <p className="mt-3 text-sm text-foreground/70">Loading profile...</p>
        )}

        {!isLoading && profileState && !profileState.unlocked && (
          <div className="mt-4 rounded-xl border border-white/10 bg-carbon-lighter/50 p-4 text-sm text-foreground/70">
            {profileState.teaser.hint}
          </div>
        )}

        {profile && (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-white/10 bg-carbon-lighter/50 p-4 text-sm text-foreground/80">
              {profile.summary ?? "Music DNA summary not available yet."}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-carbon-lighter/50 p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
                  Dominant Genre
                </div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {profile.dominantGenre ?? "N/A"}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-carbon-lighter/50 p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
                  Genre Variety
                </div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {Math.round(profile.genreVarietyScore * 100)}%
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-carbon-lighter/50 p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">Energy</div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {formatUnitMetric(profile.averageEnergy)}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-carbon-lighter/50 p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">Valence</div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {formatUnitMetric(profile.averageValence)}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-carbon-lighter/50 p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
                  Danceability
                </div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {formatUnitMetric(profile.averageDanceability)}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-carbon-lighter/50 p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
                  Generated From Votes
                </div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {profile.generatedFromVotes}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-carbon-lighter/50 p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/50">
                Decade Distribution
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(profile.decadeDistribution).length === 0 && (
                  <span className="text-xs text-foreground/60">No decade data yet.</span>
                )}
                {Object.entries(profile.decadeDistribution).map(([decade, count]) => (
                  <span
                    key={decade}
                    className="rounded-full border border-white/20 px-2 py-1 text-[11px] text-foreground/80"
                  >
                    {decade}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {(profileError || regenerateError) && (
          <div className="mt-4 rounded-xl border border-campfire-pink/30 bg-campfire-pink/10 p-3 text-xs text-campfire-pink">
            {regenerateError ?? profileError}
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

