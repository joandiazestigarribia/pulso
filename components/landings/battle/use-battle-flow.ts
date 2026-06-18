"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import type { Battle, Track } from "@/lib/mock-data"
import { resolveConversionExperiment } from "@/lib/conversion-experiments"
import { trackClientEvent } from "@/lib/client-events"
import { MUSIC_DNA_UNLOCK_THRESHOLD } from "@/lib/music-dna-config"

function isBattle(value: unknown): value is Battle {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<Battle>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.userId === "string" &&
    candidate.trackA !== undefined &&
    candidate.trackB !== undefined
  )
}

const fetchBattle = async (url: string): Promise<Battle> => {
  const response = await fetch(url)
  const payload: unknown = await response.json()

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : "Unable to fetch battle"
    throw new Error(message)
  }

  if (!isBattle(payload)) {
    throw new Error("Unable to fetch battle")
  }

  return payload
}

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Unable to fetch resource")
  }

  return (await response.json()) as T
}

export interface VoteTrackResult {
  id: string
  name: string
  newElo: number
  eloChange: number
}

interface VoteResponse {
  winner: VoteTrackResult
  loser: VoteTrackResult
}

interface VoteErrorResponse {
  error: string
  code?: string
}

interface PreviewRefreshResponse {
  ok: boolean
  trackId: string
  previewUrl: string | null
  previewSource: string | null
}

interface BattleStatsResponse {
  completedBattlesCount: number
}

interface BattleResetResponse {
  ok: boolean
  code?: string
  message?: string
  data?: {
    deletedBattles: number
  }
}

interface AuthSessionResponse {
  isAuthenticated: boolean
  userId: string | null
  anonymousId: string | null
}

export const PROFILE_UI_GOAL_VOTES = 20
const MAX_CONSECUTIVE_SKIPS = 5

export function useBattleFlow() {
  const [battleApiUrl, setBattleApiUrl] = useState("/api/battle")
  const { data: battle, error: battleError, mutate } = useSWR<Battle>(battleApiUrl, fetchBattle, {
    revalidateOnFocus: false,
  })
  const { data: stats, mutate: mutateStats } = useSWR<BattleStatsResponse>("/api/battle/stats", fetchJson, {
    revalidateOnFocus: false,
  })
  const { data: session } = useSWR<AuthSessionResponse>("/api/identity/session", fetchJson, {
    revalidateOnFocus: false,
  })

  const [isVoting, setIsVoting] = useState(false)
  const [voteResult, setVoteResult] = useState<{ winner: string; loser: string } | null>(null)
  const [battleKey, setBattleKey] = useState(0)
  const [voteFeedback, setVoteFeedback] = useState<{ winner: VoteTrackResult; loser: VoteTrackResult } | null>(
    null
  )
  const [voteError, setVoteError] = useState<string | null>(null)
  const [resetError, setResetError] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [consecutiveSkips, setConsecutiveSkips] = useState(0)
  const [isSkipLimitModalOpen, setIsSkipLimitModalOpen] = useState(false)
  const [activePreviewTrackId, setActivePreviewTrackId] = useState<string | null>(null)
  const [refreshingPreviewTrackId, setRefreshingPreviewTrackId] = useState<string | null>(null)
  const [hasTrackedPromptShown, setHasTrackedPromptShown] = useState(false)
  const [authConfirmation, setAuthConfirmation] = useState<{ movedBattles: number } | null>(null)
  const voteRequestInFlightRef = useRef(false)
  const previewRefreshAttemptsRef = useRef<Map<string, number>>(new Map())

  const identitySeed = session?.userId ?? session?.anonymousId ?? "guest"
  const experiment = useMemo(() => resolveConversionExperiment(identitySeed), [identitySeed])
  const completedBattles = stats?.completedBattlesCount ?? 0
  const isAuthenticated = Boolean(session?.isAuthenticated)
  const shouldShowAuthPrompt = !isAuthenticated && completedBattles >= experiment.votePromptThreshold
  const hasReachedUnlockThreshold = completedBattles >= MUSIC_DNA_UNLOCK_THRESHOLD

  useEffect(() => {
    setActivePreviewTrackId(null)
    previewRefreshAttemptsRef.current.clear()
  }, [battle?.id])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const source = searchParams.get("source")
    const auth = searchParams.get("auth")
    const mergedBattlesRaw = searchParams.get("mergedBattles")

    if (source) {
      setBattleApiUrl(`/api/battle?source=${encodeURIComponent(source)}`)
    }

    if (auth === "done") {
      const movedBattles = Number.parseInt(mergedBattlesRaw ?? "0", 10)
      setAuthConfirmation({ movedBattles: Number.isFinite(movedBattles) ? Math.max(0, movedBattles) : 0 })
    }
  }, [])

  useEffect(() => {
    if (!shouldShowAuthPrompt || hasTrackedPromptShown || !battle) {
      return
    }

    setHasTrackedPromptShown(true)
    void trackClientEvent({
      eventName: "auth_prompt_shown",
      battleId: battle.id,
      variant: experiment.key,
      metadata: {
        timingVariant: experiment.timingVariant,
        copyVariant: experiment.copyVariant,
        completedBattles,
      },
    })
  }, [battle, completedBattles, experiment, hasTrackedPromptShown, shouldShowAuthPrompt])

  const handleTogglePreview = useCallback((track: Track) => {
    if (!track.previewUrl) {
      return
    }

    setActivePreviewTrackId((prev) => (prev === track.id ? null : track.id))
  }, [])

  const handlePreviewEnded = useCallback((trackId: string) => {
    setActivePreviewTrackId((prev) => (prev === trackId ? null : prev))
  }, [])

  const handlePreviewError = useCallback(
    async (track: Track) => {
      if (!battle || refreshingPreviewTrackId === track.id) {
        return
      }

      const refreshAttempts = previewRefreshAttemptsRef.current.get(track.id) ?? 0
      if (refreshAttempts >= 1) {
        setVoteError("No se pudo actualizar la vista previa de esta cancion.")
        return
      }
      previewRefreshAttemptsRef.current.set(track.id, refreshAttempts + 1)

      setRefreshingPreviewTrackId(track.id)
      setActivePreviewTrackId(null)

      try {
        const response = await fetch("/api/battle/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackId: track.id }),
        })

        const payload = (await response.json().catch(() => null)) as PreviewRefreshResponse | null
        if (!response.ok || !payload || payload.trackId !== track.id) {
          setVoteError("No se pudo refrescar la vista previa. Intenta con otra cancion.")
          return
        }

        if (!payload.previewUrl) {
          setVoteError("Vista previa no disponible para esta cancion.")
        }

        const updatedBattle: Battle = {
          ...battle,
          trackA:
            battle.trackA.id === track.id
              ? {
                  ...battle.trackA,
                  previewUrl: payload.previewUrl,
                  previewSource: payload.previewSource,
                  previewCheckedAt: new Date().toISOString(),
                }
              : battle.trackA,
          trackB:
            battle.trackB.id === track.id
              ? {
                  ...battle.trackB,
                  previewUrl: payload.previewUrl,
                  previewSource: payload.previewSource,
                  previewCheckedAt: new Date().toISOString(),
                }
              : battle.trackB,
        }

        await mutate(updatedBattle, { revalidate: false })

        if (payload.previewUrl) {
          setActivePreviewTrackId(track.id)
        }
      } catch {
        setVoteError("Error al actualizar la vista previa.")
      } finally {
        setRefreshingPreviewTrackId(null)
      }
    },
    [battle, mutate, refreshingPreviewTrackId]
  )

  const handleVote = useCallback(
    async (winnerId: string) => {
      if (isVoting || !battle || voteRequestInFlightRef.current) {
        return
      }

      voteRequestInFlightRef.current = true
      setVoteError(null)
      setIsVoting(true)
      setActivePreviewTrackId(null)

      const loserId = winnerId === battle.trackA.id ? battle.trackB.id : battle.trackA.id
      setVoteResult({ winner: winnerId, loser: loserId })

      try {
        const response = await fetch("/api/battle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ battleId: battle.id, winnerId, loserId, userId: battle.userId }),
        })

        const result = (await response.json()) as VoteResponse | VoteErrorResponse

        if (!response.ok || !("winner" in result) || !("loser" in result)) {
          if (
            response.status === 409 &&
            "code" in result &&
            result.code === "battle_already_completed"
          ) {
            setVoteResult(null)
            await Promise.all([mutate(), mutateStats()])
            setIsVoting(false)
            return
          }

          const serverError = "error" in result && typeof result.error === "string" ? result.error : null
          setVoteError(serverError ?? "Could not save your vote. Please try again.")
          setVoteResult(null)
          setIsVoting(false)
          return
        }

        setVoteFeedback({ winner: result.winner, loser: result.loser })
      } catch {
        setVoteError("Network error while saving your vote.")
        setVoteResult(null)
        setIsVoting(false)
        return
      } finally {
        voteRequestInFlightRef.current = false
      }

      await new Promise((resolve) => setTimeout(resolve, 1400))

      setVoteResult(null)
      setVoteFeedback(null)
      setIsVoting(false)
      setConsecutiveSkips(0)
      setBattleKey((prev) => prev + 1)
      await Promise.all([mutate(), mutateStats()])
    },
    [battle, isVoting, mutate, mutateStats]
  )

  const handleResetProgress = useCallback(async () => {
    if (isResetting) {
      return
    }

    setIsResetting(true)
    setResetError(null)
    setVoteError(null)
    setVoteFeedback(null)
    setVoteResult(null)
    setActivePreviewTrackId(null)
    setConsecutiveSkips(0)

    try {
      const response = await fetch("/api/battle/reset", {
        method: "POST",
      })

      const payload = (await response.json().catch(() => ({}))) as BattleResetResponse
      if (!response.ok || payload.ok === false) {
        setResetError(payload.message ?? "No se pudo reiniciar el progreso.")
        return
      }

      await Promise.all([mutateStats(), mutate()])
      setBattleKey((prev) => prev + 1)
    } catch {
      setResetError("Error de red al reiniciar progreso.")
    } finally {
      setIsResetting(false)
    }
  }, [isResetting, mutate, mutateStats])

  const handleSkipStage = useCallback(async () => {
    if (isVoting || isSkipping || !battle) {
      return
    }

    if (consecutiveSkips >= MAX_CONSECUTIVE_SKIPS) {
      setIsSkipLimitModalOpen(true)
      return
    }

    setIsSkipping(true)
    setVoteError(null)
    setResetError(null)
    setVoteFeedback(null)
    setVoteResult(null)
    setActivePreviewTrackId(null)

    try {
      setBattleKey((prev) => prev + 1)
      setConsecutiveSkips((prev) => prev + 1)
      await mutate()
    } catch {
      setVoteError("No se pudo avanzar al siguiente duelo. Intenta de nuevo.")
    } finally {
      setIsSkipping(false)
    }
  }, [battle, consecutiveSkips, isSkipping, isVoting, mutate])

  const activePreviewTrackName = activePreviewTrackId
    ? [battle?.trackA, battle?.trackB].find((track) => track?.id === activePreviewTrackId)?.name ?? "Reproduciendo..."
    : "Reproduccion detenida"

  return {
    battle,
    battleError,
    isVoting,
    voteResult,
    battleKey,
    voteFeedback,
    voteError,
    resetError,
    isResetting,
    isSkipping,
    consecutiveSkips,
    maxConsecutiveSkips: MAX_CONSECUTIVE_SKIPS,
    isSkipLimitModalOpen,
    activePreviewTrackId,
    refreshingPreviewTrackId,
    authConfirmation,
    shouldShowAuthPrompt,
    hasReachedUnlockThreshold,
    completedBattles,
    experimentCopyVariant: experiment.copyVariant,
    activePreviewTrackName,
    setAuthConfirmation,
    handleTogglePreview,
    handlePreviewEnded,
    handlePreviewError,
    handleVote,
    handleResetProgress,
    handleSkipStage,
    closeSkipLimitModal: () => setIsSkipLimitModalOpen(false),
  }
}
