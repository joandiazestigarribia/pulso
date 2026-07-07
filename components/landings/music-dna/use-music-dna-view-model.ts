"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  fetcher,
  getDominantGenres,
  getRadarAxes,
  resolvePersonaDisplayName,
  resolvePersonaShareCopy,
  resolveRadarProfile,
  resolveSonicPersona,
  type FullProfileResponse,
  type IdentitySessionResponse,
} from "@/lib/music-dna"

export type ShareNetwork = "x" | "whatsapp" | "telegram" | "facebook" | "instagram"

interface BattleResetResponse {
  ok: boolean
  code?: string
  message?: string
  data?: {
    deletedBattles: number
  }
}

export function useMusicDnaViewModel() {
  const [isResetting, setIsResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)

  const { data: profileResponse, mutate: refreshProfile, isLoading } = useSWR<FullProfileResponse>(
    "/api/profile/full",
    fetcher,
    { revalidateOnFocus: false }
  )
  const { data: identitySession } = useSWR<IdentitySessionResponse>("/api/identity/session", fetcher, {
    revalidateOnFocus: false,
  })

  const profileState = profileResponse?.data
  const profile = profileState?.profile
  const profileError = profileResponse?.ok === false ? profileResponse.message : profileState?.error?.message

  const dominantGenres = useMemo(() => getDominantGenres(profileState), [profileState])
  const sonicPersona = useMemo(() => resolveSonicPersona(profileState, dominantGenres), [dominantGenres, profileState])
  const sonicPersonaDisplayName = useMemo(() => resolvePersonaDisplayName(sonicPersona), [sonicPersona])
  const shareCopy = useMemo(
    () =>
      resolvePersonaShareCopy({
        persona: sonicPersona,
        profileState,
        dominantGenres,
        userId: identitySession?.userId ?? null,
        anonymousId: identitySession?.anonymousId ?? null,
      }),
    [dominantGenres, identitySession?.anonymousId, identitySession?.userId, profileState, sonicPersona]
  )
  const radarProfile = useMemo(() => resolveRadarProfile(profileState), [profileState])
  const radarAxes = useMemo(() => getRadarAxes(radarProfile), [radarProfile])

  const intensityScore = radarAxes.find((axis) => axis.key === "energy")?.value ?? 0.5
  const rhythmScore = radarAxes.find((axis) => axis.key === "bpm")?.value ?? 0.5
  const danceScore = radarAxes.find((axis) => axis.key === "dance")?.value ?? 0.5
  const explorationScore = radarAxes.find((axis) => axis.key === "obscurity")?.value ?? 0.5

  const totalBattles = profileState?.completedBattlesCount ?? 0
  const analyzedVotes = profile?.generatedFromVotes ?? totalBattles
  const shareDescription =
    shareCopy.description || "Tu selecciÃ³n combina energÃ­a, ritmo y estilo con una firma sonora Ãºnica."

  const buildShareUrl = (): string => {
    if (typeof window === "undefined") {
      return "https://pulso.app/music-dna"
    }
    return window.location.href
  }

  const buildShareText = (): string => `${shareCopy.headline}\n${shareDescription}`
  const buildDescriptionText = (): string => shareDescription

  const shareToNetwork = (network: ShareNetwork) => {
    const url = encodeURIComponent(buildShareUrl())
    const text = encodeURIComponent(buildShareText())
    const descriptionText = encodeURIComponent(buildDescriptionText())
    const rawDescription = buildDescriptionText()

    const shareLinks: Record<ShareNetwork, string> = {
      x: `https://x.com/intent/tweet?text=${text}&url=${url}`,
      whatsapp: `https://wa.me/?text=${descriptionText}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      instagram: "https://www.instagram.com/",
    }

    if (network === "instagram") {
      void navigator.clipboard
        .writeText(rawDescription)
        .then(() => {
          setShareFeedback("Texto descriptivo copiado. Se abrió Instagram para que pegues tu publicación.")
        })
        .catch(() => {
          setShareFeedback("Se abrió Instagram. Copiá manualmente el texto descriptivo para publicar.")
        })
    }

    window.open(shareLinks[network], "_blank", "noopener,noreferrer")
  }

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(buildDescriptionText())
      setShareFeedback("Texto descriptivo copiado. Ya podés compartir tu perfil sonoro.")
    } catch {
      setShareFeedback("No se pudo copiar el texto automáticamente.")
    }
  }



  const handleResetProgress = async () => {
    if (isResetting) {
      return
    }

    setIsResetting(true)
    setResetError(null)

    try {
      const response = await fetch("/api/battle/reset", {
        method: "POST",
      })

      const payload = (await response.json().catch(() => ({}))) as BattleResetResponse
      if (!response.ok || payload.ok === false) {
        setResetError(payload.message ?? "No se pudo reiniciar tu Perfil Sonoro en este momento.")
        return
      }

      await refreshProfile()
    } catch {
      setResetError("Error de red al reiniciar tu Perfil Sonoro.")
    } finally {
      setIsResetting(false)
    }
  }

  return {
    isLoading,
    profileError,
    resetError,
    isResetting,
    isShareOpen,
    shareFeedback,
    dominantGenres,
    sonicPersona,
    sonicPersonaDisplayName,
    shareCopy,
    radarAxes,
    intensityScore,
    rhythmScore,
    danceScore,
    explorationScore,
    totalBattles,
    analyzedVotes,
    shareDescription,
    setShareFeedback,
    setIsShareOpen,
    handleResetProgress,
    handleCopyShare,
    shareToNetwork,
  }
}
