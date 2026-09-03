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
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null)
  const [shareUrlSharerName, setShareUrlSharerName] = useState<string | null>(null)
  const [sharerName, setSharerName] = useState("")
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

  const buildShareTitle = (): string => {
    const trimmedName = sharerName.trim()
    return trimmedName
      ? `${trimmedName} descubrió su Perfil Sonoro en Pulso: ${sonicPersonaDisplayName}`
      : `Mi Perfil Sonoro en Pulso: ${sonicPersonaDisplayName}`
  }

  const ensureShareLink = useCallback(async (): Promise<{ url: string; imageUrl: string } | null> => {
    const normalizedName = sharerName.trim() || null
    if (shareUrl && shareImageUrl && shareUrlSharerName === normalizedName) {
      return {
        url: shareUrl,
        imageUrl: shareImageUrl,
      }
    }

    setIsShareLinkLoading(true)
    try {
      const response = await fetch("/api/profile/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sharerName: normalizedName }),
      })
      const payload = (await response.json().catch(() => ({}))) as ProfileShareResponse
      if (!response.ok || payload.ok === false || !payload.data?.url) {
        setShareFeedback(payload.message ?? "No se pudo preparar el link publico del perfil.")
        return null
      }

      setShareUrl(payload.data.url)
      setShareImageUrl(payload.data.imageUrl)
      setShareUrlSharerName(normalizedName)
      return {
        url: payload.data.url,
        imageUrl: payload.data.imageUrl,
      }
    } catch {
      setShareFeedback("Error de red al preparar el link publico del perfil.")
      return null
    } finally {
      setIsShareLinkLoading(false)
    }
  }, [shareImageUrl, shareUrl, shareUrlSharerName, sharerName])

  useEffect(() => {
    if (!isShareOpen || shareUrl || isShareLinkLoading) {
      return
    }

    void ensureShareLink()
  }, [ensureShareLink, isShareLinkLoading, isShareOpen, shareUrl])

  const shareToInstagram = async (imageUrl: string, url: string, title: string) => {
    try {
      const response = await fetch(imageUrl)
      if (response.ok) {
        const blob = await response.blob()
        const file = new File([blob], "perfil-sonoro-pulso.png", { type: blob.type || "image/png" })

        if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title, text: title })
          setShareFeedback("Elegí Instagram en el panel para compartir tu perfil.")
          return
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
    }

    try {
      await navigator.clipboard.writeText(`${title}\n${url}`)
      setShareFeedback("Copiamos el texto. Abrí Instagram y pegalo en tu publicación o historia.")
    } catch {
      setShareFeedback("Abrí Instagram y compartilo manualmente: no pudimos copiar el link.")
    }

    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer")
  }

  const shareToNetwork = async (network: ShareNetwork) => {
    const shareLink = await ensureShareLink()
    if (!shareLink) {
      return
    }

    const title = buildShareTitle()

    if (network === "instagram") {
      await shareToInstagram(shareLink.imageUrl, shareLink.url, title)
      return
    }

    const url = encodeURIComponent(shareLink.url)
    const encodedTitle = encodeURIComponent(title)
    const message = encodeURIComponent(`${title}\n${shareLink.url}`)

    const shareLinks: Record<Exclude<ShareNetwork, "instagram">, string> = {
      x: `https://x.com/intent/tweet?text=${encodedTitle}&url=${url}`,
      whatsapp: `https://wa.me/?text=${message}`,
      telegram: `https://t.me/share/url?url=${url}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
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
    sharerName,
    setSharerName,
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
