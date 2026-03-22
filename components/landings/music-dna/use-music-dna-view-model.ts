"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  fetcher,
  getDominantGenres,
  getRadarAxes,
  resolvePersonaShareCopy,
  resolveRadarProfile,
  resolveSonicPersona,
  type FullProfileResponse,
  type IdentitySessionResponse,
} from "@/lib/music-dna"

export type ShareNetwork = "x" | "whatsapp" | "telegram" | "facebook"

export function useMusicDnaViewModel() {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)
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
    shareCopy.description || "Tu seleccion combina energia, ritmo y estilo con una firma sonora unica."
  const shareTitle = `${sonicPersona.name} | Music DNA Pulso`

  const buildShareUrl = (): string => {
    if (typeof window === "undefined") {
      return "https://pulso.app/music-dna"
    }
    return window.location.href
  }

  const buildShareText = (): string => `${shareCopy.headline}\n${shareDescription}`

  const shareToNetwork = (network: ShareNetwork) => {
    const url = encodeURIComponent(buildShareUrl())
    const text = encodeURIComponent(buildShareText())

    const shareLinks: Record<ShareNetwork, string> = {
      x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${buildShareText()} ${buildShareUrl()}`)}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    }

    window.open(shareLinks[network], "_blank", "noopener,noreferrer")
  }

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(`${buildShareText()}\n${buildShareUrl()}`)
      setShareFeedback("Link copiado. Ya podes compartir tu perfil sonoro.")
    } catch {
      setShareFeedback("No se pudo copiar el link automaticamente.")
    }
  }

  const handleNativeShare = async () => {
    if (!navigator.share) {
      setShareFeedback("Tu navegador no soporta share nativo. Usa las redes o copia link.")
      return
    }

    try {
      await navigator.share({
        title: shareTitle,
        text: buildShareText(),
        url: buildShareUrl(),
      })
      setShareFeedback("Perfil compartido con exito.")
    } catch {
      setShareFeedback("Se cancelo el compartido.")
    }
  }

  const handleRegenerate = async () => {
    if (isRegenerating) {
      return
    }

    setIsRegenerating(true)
    setRegenerateError(null)

    try {
      const response = await fetch("/api/profile/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRegenerate: true }),
      })

      const payload = (await response.json().catch(() => ({}))) as FullProfileResponse
      if (!response.ok || payload.ok === false) {
        setRegenerateError(payload.message ?? "No se pudo regenerar Music DNA en este momento.")
      }

      await refreshProfile()
    } catch {
      setRegenerateError("Error de red al regenerar Music DNA.")
    } finally {
      setIsRegenerating(false)
    }
  }

  return {
    isLoading,
    profileError,
    regenerateError,
    isRegenerating,
    isShareOpen,
    shareFeedback,
    dominantGenres,
    sonicPersona,
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
    handleRegenerate,
    handleCopyShare,
    handleNativeShare,
    shareToNetwork,
  }
}
