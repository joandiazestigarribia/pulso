"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Lock, Zap } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"
import { resolveConversionExperiment } from "@/lib/conversion-experiments"
import { trackClientEvent } from "@/lib/client-events"

const fetcher = (url: string) => fetch(url).then((response) => response.json())

interface BattleStatsResponse {
  completedBattlesCount: number
}

interface ProfileInsightsResponse {
  ok: boolean
  code?: string
  message?: string
  data?: {
    unlockThreshold: number
    completedBattlesCount: number
    unlocked: boolean
    teaser: {
      hint: string
      completedBattlesCount: number
      unlockThreshold: number
      remainingBattles: number
      topGenres: Array<{ genre: string; count: number }>
      topSubgenres: Array<{ genre: string; count: number }>
      averageEnergy: number | null
      averageValence: number | null
      averageDanceability: number | null
    }
    hasCachedProfile: boolean
    error: {
      code: "PROFILE_GENERATION_FAILED"
      message: string
    } | null
  }
}

interface AuthSessionResponse {
  isAuthenticated: boolean
  userId: string | null
  anonymousId: string | null
  spotifyConnected: boolean
  spotifyTokenError: string | null
}

export default function ProfilePage() {
  const { data: stats } = useSWR<BattleStatsResponse>("/api/battle/stats", fetcher, {
    revalidateOnFocus: false,
  })
  const { data: insights } = useSWR<ProfileInsightsResponse>("/api/profile/insights", fetcher, {
    revalidateOnFocus: false,
  })
  const { data: session } = useSWR<AuthSessionResponse>("/api/identity/session", fetcher, {
    revalidateOnFocus: false,
  })

  const battlesCompleted = insights?.data?.completedBattlesCount ?? stats?.completedBattlesCount ?? 0
  const battlesRequired = insights?.data?.unlockThreshold ?? 10
  const teaserHint = insights?.data?.teaser.hint ?? "Battle more tracks to unlock your full Music DNA profile."
  const teaserTopGenres = insights?.data?.teaser.topGenres ?? []
  const teaserTopSubgenres = insights?.data?.teaser.topSubgenres ?? []
  const insightsError = !insights?.ok ? insights?.message : insights?.data?.error?.message
  const hasUnlocked = Boolean(insights?.data?.unlocked ?? battlesCompleted >= battlesRequired)
  const [hasTrackedTeaserView, setHasTrackedTeaserView] = useState(false)
  const [authConfirmation, setAuthConfirmation] = useState<{
    movedBattles: number
  } | null>(null)
  const identitySeed = session?.userId ?? session?.anonymousId ?? "guest"
  const experiment = useMemo(() => resolveConversionExperiment(identitySeed), [identitySeed])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get("auth") !== "done") {
      return
    }

    const movedBattles = Number.parseInt(url.searchParams.get("mergedBattles") ?? "0", 10)
    setAuthConfirmation({
      movedBattles: Number.isFinite(movedBattles) ? Math.max(0, movedBattles) : 0,
    })
  }, [])

  useEffect(() => {
    if (hasTrackedTeaserView) {
      return
    }

    setHasTrackedTeaserView(true)
    void trackClientEvent({
      eventName: "profile_teaser_viewed",
      variant: experiment.key,
      metadata: {
        completedBattles: battlesCompleted,
        isAuthenticated: Boolean(session?.isAuthenticated),
      },
    })
  }, [battlesCompleted, experiment.key, hasTrackedTeaserView, session?.isAuthenticated])

  return (
    <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-16 pb-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-carbon-light/80 backdrop-blur-xl border border-campfire-purple/30 rounded-3xl p-8 text-center">
          {authConfirmation && (
            <div className="mb-5 rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-2 text-left">
              <p className="text-xs text-neon-cyan">
                Progress linked.
                {" "}
                {authConfirmation.movedBattles > 0
                  ? `${authConfirmation.movedBattles} anonymous battles were preserved after login.`
                  : "Your current progress now syncs with your account."}
              </p>
              <button
                type="button"
                onClick={() => setAuthConfirmation(null)}
                className="mt-2 text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-neon-cyan/80 hover:text-neon-cyan"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="relative mx-auto w-32 h-32 mb-6">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-campfire-purple/40"
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-3 rounded-full border border-campfire-pink/30"
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.3 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-carbon-lighter flex items-center justify-center border border-campfire-purple/30">
                <Lock className="w-7 h-7 text-campfire-purple/70" />
              </div>
            </div>
          </div>

          <h1 className="font-mono font-black text-2xl uppercase tracking-wider text-foreground mb-3">
            Music DNA
          </h1>
          <h2 className="font-mono font-bold text-sm uppercase tracking-widest text-campfire-purple mb-6">
            {hasUnlocked ? "Profile Ready" : "Profile Locked"}
          </h2>

          <p className="font-sans text-sm text-foreground/60 mb-6 leading-relaxed">
            {session?.isAuthenticated
              ? "Your progress is linked to your account. Keep battling to unlock full Music DNA."
              : "You can battle without login. Sign in later to sync your progress across devices and unlock export flows."}
          </p>

          <div className="mb-6">
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-foreground/50 mb-2">
              <span>Progress</span>
              <span>{battlesCompleted}/{battlesRequired} Battles</span>
            </div>
            <div className="h-2 bg-carbon-lighter rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-campfire-pink to-campfire-purple rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (battlesCompleted / battlesRequired) * 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-white/10 bg-carbon-lighter/60 p-3 text-left">
            <div className="font-mono text-[10px] uppercase tracking-widest text-campfire-purple/80">
              Early Insight
            </div>
            <p className="mt-2 text-xs leading-relaxed text-foreground/75">{teaserHint}</p>
            {teaserTopGenres.length > 0 && (
              <p className="mt-2 text-[11px] text-foreground/70">
                Top genres:
                {" "}
                {teaserTopGenres.map((entry) => `${entry.genre} (${entry.count})`).join(" · ")}
              </p>
            )}
            {teaserTopSubgenres.length > 0 && (
              <p className="mt-2 text-[11px] text-foreground/70">
                Top subgenres:
                {" "}
                {teaserTopSubgenres.map((entry) => `${entry.genre} (${entry.count})`).join(" · ")}
              </p>
            )}
            {insightsError && (
              <p className="mt-2 text-xs text-campfire-pink">
                {insightsError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/battle">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-2xl font-mono font-black text-sm uppercase tracking-wider text-carbon bg-gradient-to-r from-campfire-lime to-neon-green flex items-center justify-center gap-2 cursor-pointer"
                style={{ boxShadow: "0 4px 20px rgba(57, 255, 20, 0.2)" }}
              >
                Continue Battling
                <Zap className="w-4 h-4" />
              </motion.div>
            </Link>

            {!session?.isAuthenticated && (
              <>
                <Link
                  href="/login?next=%2Fprofile"
                  onClick={() => {
                    void trackClientEvent({
                      eventName: "auth_prompt_shown",
                      variant: experiment.key,
                      metadata: {
                        trigger: "profile_locked_save_progress",
                        completedBattles: battlesCompleted,
                      },
                    })
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3.5 rounded-2xl font-mono font-black text-sm uppercase tracking-wider text-foreground border border-campfire-purple/40 bg-carbon-lighter/70 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Save Progress
                  </motion.div>
                </Link>

                {hasUnlocked && (
                  <Link
                    href="/login?next=%2Fprofile%2Ffull"
                    onClick={() => {
                      void trackClientEvent({
                        eventName: "auth_prompt_shown",
                        variant: experiment.key,
                        metadata: {
                          trigger: "playlist_generation_prompt",
                          completedBattles: battlesCompleted,
                        },
                      })
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-3.5 rounded-2xl font-mono font-black text-sm uppercase tracking-wider text-carbon bg-gradient-to-r from-neon-cyan to-neon-green flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Login to Generate Playlist
                    </motion.div>
                  </Link>
                )}
              </>
            )}

            {session?.isAuthenticated && (
              <Link href="/profile/full">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-2xl font-mono font-black text-sm uppercase tracking-wider text-foreground border border-campfire-purple/40 bg-carbon-lighter/70 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Open Full Profile
                </motion.div>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </main>
  )
}
