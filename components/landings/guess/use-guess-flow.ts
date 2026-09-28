"use client"

import { useCallback, useEffect, useState } from "react"
import type { Track } from "@/lib/mock-data"

export interface GuessRoundPayload {
  roundIndex: number
  totalRounds: number
  cardA: Track
  cardB: Track
}

export interface GuessAttemptSummary {
  attemptId: string
  nickname: string
  score: number
  totalRounds: number
  percentage: number
  completedAt: string
}

export interface GuessLeaderboardEntry {
  attemptId: string
  nickname: string
  score: number
  totalRounds: number
  percentage: number
  completedAt: string
}

type RoundStateResponse =
  | { status: "in_progress"; round: GuessRoundPayload }
  | { status: "completed"; summary: GuessAttemptSummary }

interface AnswerResponse {
  correct: boolean
  correctTrackId: string
  isFinished: boolean
  score: number
  totalRounds: number
  percentage: number
}

export type GuessPhase =
  | { kind: "loading" }
  | { kind: "owner" }
  | { kind: "needs-nickname" }
  | { kind: "playing"; round: GuessRoundPayload }
  | { kind: "revealing"; round: GuessRoundPayload; chosenTrackId: string; correctTrackId: string; correct: boolean }
  | { kind: "completed"; summary: GuessAttemptSummary }
  | { kind: "error"; message: string }

async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ status: number; body: T | null }> {
  const response = await fetch(url, init)
  const body = (await response.json().catch(() => null)) as T | null
  return { status: response.status, body }
}

export function useGuessFlow(playlistId: string) {
  const [phase, setPhase] = useState<GuessPhase>({ kind: "loading" })
  const [leaderboard, setLeaderboard] = useState<GuessLeaderboardEntry[] | null>(null)
  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const [answerError, setAnswerError] = useState<string | null>(null)
  const [failedPickTrackId, setFailedPickTrackId] = useState<string | null>(null)
  const [isSubmittingNickname, setIsSubmittingNickname] = useState(false)
  const [isAnswering, setIsAnswering] = useState(false)

  const loadLeaderboard = useCallback(async () => {
    const { body } = await fetchJson<GuessLeaderboardEntry[]>(`/api/guess/${playlistId}/leaderboard`)
    setLeaderboard(body ?? [])
  }, [playlistId])

  const loadCurrentRound = useCallback(async () => {
    const { status, body } = await fetchJson<RoundStateResponse & { code?: string }>(
      `/api/guess/${playlistId}/round`
    )

    if (status === 403) {
      setPhase({ kind: "owner" })
      void loadLeaderboard()
      return
    }

    // 401 means no identity at all; 404 attempt_not_found means an identity never started
    // this playlist. Both cases resolve to "ask for a nickname", not "something went wrong".
    if (status === 401 || (status === 404 && body?.code === "attempt_not_found")) {
      setPhase({ kind: "needs-nickname" })
      return
    }

    if (!body || status >= 400) {
      setPhase({ kind: "error", message: "No pudimos cargar el juego. Probá de nuevo." })
      return
    }

    if (body.status === "completed") {
      setPhase({ kind: "completed", summary: body.summary })
      void loadLeaderboard()
      return
    }

    setPhase({ kind: "playing", round: body.round })
  }, [playlistId, loadLeaderboard])

  useEffect(() => {
    void loadCurrentRound()
  }, [playlistId, loadCurrentRound])

  const submitNickname = useCallback(
    async (nickname: string) => {
      if (isSubmittingNickname) {
        return
      }

      setIsSubmittingNickname(true)
      setNicknameError(null)

      try {
        const { status } = await fetchJson(`/api/guess/${playlistId}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nickname }),
        })

        if (status === 403) {
          setPhase({ kind: "owner" })
          void loadLeaderboard()
          return
        }

        if (status >= 400) {
          setNicknameError("No pudimos empezar el juego. Probá de nuevo.")
          return
        }

        await loadCurrentRound()
      } catch {
        setNicknameError("Error de red. Probá de nuevo.")
      } finally {
        setIsSubmittingNickname(false)
      }
    },
    [playlistId, isSubmittingNickname, loadCurrentRound, loadLeaderboard]
  )

  const submitPick = useCallback(
    async (chosenTrackId: string) => {
      if (phase.kind !== "playing" || isAnswering) {
        return
      }

      const { round } = phase
      setIsAnswering(true)
      setAnswerError(null)

      try {
        const { status, body } = await fetchJson<AnswerResponse>(`/api/guess/${playlistId}/round`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roundIndex: round.roundIndex, chosenTrackId }),
        })

        if (status >= 400 || !body) {
          setFailedPickTrackId(chosenTrackId)
          setAnswerError("No pudimos guardar tu respuesta. Probá de nuevo.")
          return
        }

        setFailedPickTrackId(null)
        setPhase({
          kind: "revealing",
          round,
          chosenTrackId,
          correctTrackId: body.correctTrackId,
          correct: body.correct,
        })

        // Correct reads instantly; the incorrect copy is a full sentence, so it needs more time.
        const revealDurationMs = body.correct ? 1300 : 2000
        await new Promise((resolve) => setTimeout(resolve, revealDurationMs))
        await loadCurrentRound()
      } catch {
        setFailedPickTrackId(chosenTrackId)
        setAnswerError("Error de red al guardar tu respuesta.")
      } finally {
        setIsAnswering(false)
      }
    },
    [phase, isAnswering, playlistId, loadCurrentRound]
  )

  const retryPick = useCallback(() => {
    if (!failedPickTrackId) {
      return
    }

    void submitPick(failedPickTrackId)
  }, [failedPickTrackId, submitPick])

  return {
    phase,
    leaderboard,
    nicknameError,
    answerError,
    isSubmittingNickname,
    isAnswering,
    submitNickname,
    submitPick,
    retryPick,
  }
}
