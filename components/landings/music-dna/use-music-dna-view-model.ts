"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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

interface ProfileShareResponse {
  ok: boolean
  code?: string
  message?: string
  data?: {
    token: string
    url: string
    imageUrl: string
  }
}

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
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isShareLinkLoading, setIsShareLinkLoading] = useState(false)

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
    shareCopy.description || "Tu selección combina energía, ritmo y estilo con una firma sonora única."

  const buildShareTitle = (): string => `Mi Perfil Sonoro en Pulso: ${sonicPersonaDisplayName}`

  const ensureShareLink = useCallback(async (): Promise<{ url: string } | null> => {
    if (shareUrl) {
      return {
        url: shareUrl,
      }
    }

    setIsShareLinkLoading(true)
    try {
      const response = await fetch("/api/profile/share", {
        method: "POST",
      })
      const payload = (await response.json().catch(() => ({}))) as ProfileShareResponse
      if (!response.ok || payload.ok === false || !payload.data?.url) {
        setShareFeedback(payload.message ?? "No se pudo preparar el link publico del perfil.")
        return null
      }

      setShareUrl(payload.data.url)
      return {
        url: payload.data.url,
      }
    } catch {
      setShareFeedback("Error de red al preparar el link publico del perfil.")
      return null
    } finally {
      setIsShareLinkLoading(false)
    }
  }, [shareUrl])

  useEffect(() => {
    if (!isShareOpen || shareUrl || isShareLinkLoading) {
      return
    }

    void ensureShareLink()
  }, [ensureShareLink, isShareLinkLoading, isShareOpen, shareUrl])

  const shareToNetwork = async (network: ShareNetwork) => {
    const shareLink = await ensureShareLink()
    if (!shareLink) {
      return
    }

    const url = encodeURIComponent(shareLink.url)
    const title = encodeURIComponent(buildShareTitle())
    const message = encodeURIComponent(`${buildShareTitle()}\n${shareLink.url}`)

    const shareLinks: Record<ShareNetwork, string> = {
      x: `https://x.com/intent/tweet?text=${title}&url=${url}`,
      whatsapp: `https://wa.me/?text=${message}`,
      telegram: `https://t.me/share/url?url=${url}&text=${title}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      instagram: "https://www.instagram.com/",
    }

    if (network === "instagram") {
      setShareFeedback("Instagram se abrio en una nueva pestaña. Copia el enlace si queres pegarlo manualmente.")
    }

    window.open(shareLinks[network], "_blank", "noopener,noreferrer")
  }

  const handleCopyShare = async () => {
    const shareLink = await ensureShareLink()
    if (!shareLink) {
      return
    }

    try {
      await navigator.clipboard.writeText(shareLink.url)
      setShareFeedback("Enlace publico copiado.")
    } catch {
      setShareFeedback("No se pudo copiar el link automaticamente.")
    }
  }

  const handleNativeShare = async () => {
    const shareLink = await ensureShareLink()
    if (!shareLink) {
      return
    }

    if (!navigator.share) {
      await handleCopyShare()
      return
    }

    try {
      await navigator.share({
        title: buildShareTitle(),
        text: buildShareTitle(),
        url: shareLink.url,
      })
      setShareFeedback("Perfil listo para compartir.")
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }

      setShareFeedback("No se pudo abrir el panel de compartir. Copia el link como alternativa.")
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
    shareUrl,
    isShareLinkLoading,
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
    handleNativeShare,
    shareToNetwork,
  }
}
