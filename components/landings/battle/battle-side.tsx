"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Play, Square } from "lucide-react"
import Image from "next/image"
import type { Track } from "@/lib/mock-data"

interface BattleSideProps {
  label: string
  color: string
  track: Track
  voteLabel: string
  keyLabel: string
  isVoting: boolean
  result: "winner" | "loser" | null
  activePreviewTrackId: string | null
  refreshingPreviewTrackId: string | null
  onPreviewEnded: (trackId: string) => void
  onPreviewError: (track: Track) => void
  onTogglePreview: (track: Track) => void
  onVote: () => void
  side: "left" | "right"
}

function formatAudioTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "0:00"
  }

  const totalSeconds = Math.floor(value)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, "0")}`
}

export function BattleSide({
  label,
  color,
  track,
  voteLabel,
  keyLabel,
  isVoting,
  result,
  activePreviewTrackId,
  refreshingPreviewTrackId,
  onPreviewEnded,
  onPreviewError,
  onTogglePreview,
  onVote,
  side,
}: BattleSideProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isWinner = result === "winner"
  const isLoser = result === "loser"
  const hasPreview = Boolean(track.previewUrl)
  const isRefreshingPreview = refreshingPreviewTrackId === track.id
  const isPreviewPlaying = hasPreview && activePreviewTrackId === track.id
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0)
  const [previewDuration, setPreviewDuration] = useState(30)

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    if (!hasPreview) {
      audio.pause()
      audio.currentTime = 0
      setPreviewCurrentTime(0)
      setPreviewDuration(30)
      return
    }

    if (isPreviewPlaying) {
      void audio.play().catch(() => {
        onPreviewError(track)
        onPreviewEnded(track.id)
      })
      return
    }

    audio.pause()
    audio.currentTime = 0
    setPreviewCurrentTime(0)
  }, [hasPreview, isPreviewPlaying, onPreviewEnded, onPreviewError, track, track.id, track.previewUrl])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  return (
    <section className="group relative flex flex-1 flex-col items-center justify-center">
      <div
        className={`absolute -top-3 z-20 rounded-xl border-2 border-white/40 bg-black/55 px-3 py-1 text-xs font-black uppercase tracking-wide shadow-[0_0_20px_rgba(250,70,255,0.35)] backdrop-blur md:-top-4 md:px-4 md:text-sm ${side === "left" ? "-left-10 -rotate-6 md:-rotate-12 text-[#7be3ff]" : "-right-10 rotate-6 md:rotate-12 text-[#ffb5fb]"}`}
      >
        {label}
      </div>

      <motion.div
        className="w-full max-w-[300px] rounded-[20px] border-2 bg-black/45 p-2.5 shadow-[0_0_22px_rgba(0,0,0,0.5)] backdrop-blur-none md:max-w-[320px] md:rounded-[22px] md:p-2.5"
        style={{ borderColor: color, boxShadow: `0 0 26px ${color}75` }}
        initial={{ opacity: 0, y: 16 }}
        animate={
          isLoser
            ? { opacity: 0.35, y: 0, scale: 0.96, filter: "grayscale(100%)" }
            : isWinner
              ? { opacity: 1, y: 0, scale: [1, 1.03, 1] }
              : { opacity: 1, y: 0, scale: 1 }
        }
        transition={isWinner ? { duration: 0.55 } : { duration: 0.35 }}
      >
        <div className="relative mb-2.5 aspect-[5/4] overflow-hidden rounded-[14px] border-2 border-white/35 md:mb-3 md:rounded-[16px]">
          <Image
            src={track.albumImage}
            alt={`${track.name} cover art`}
            fill
            sizes="(max-width: 1024px) 100vw, 460px"
            className="h-full w-full object-cover transition-all duration-500 group-hover:grayscale-0"
            style={{ filter: isLoser ? "grayscale(100%)" : "grayscale(20%)" }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-0 m-4 flex items-center justify-center rounded-[20px] border border-white/20 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="h-16 w-16 animate-ping rounded-full border border-white/70" />
          </div>
        </div>

        <audio
          key={`${track.id}:${track.previewUrl ?? "no-preview"}`}
          ref={audioRef}
          preload="none"
          src={track.previewUrl ?? undefined}
          onLoadedMetadata={(event) => {
            const duration = event.currentTarget.duration
            if (Number.isFinite(duration) && duration > 0) {
              setPreviewDuration(duration)
            }
          }}
          onTimeUpdate={(event) => {
            setPreviewCurrentTime(event.currentTarget.currentTime)
          }}
          onEnded={() => onPreviewEnded(track.id)}
          onError={() => onPreviewError(track)}
        />

        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-base font-black uppercase leading-none tracking-tight text-transparent md:text-lg">
                {track.name}
              </h2>
              <p className="text-xs font-semibold text-[#d8ebff] md:text-sm">{track.artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTogglePreview(track)}
              disabled={!hasPreview || isRefreshingPreview}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-black/45 text-white transition-all hover:border-white/45 hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={hasPreview ? (isPreviewPlaying ? "Detener vista previa" : "Reproducir vista previa") : "Vista previa no disponible"}
            >
              {isPreviewPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            <div className={`min-w-0 flex-1 rounded-lg border px-2 py-1.5 ${isPreviewPlaying ? "border-[#00f0ff]/45 bg-[#00f0ff]/10" : "border-white/20 bg-black/40"}`}>
              <div className="mb-1 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.12em] text-white/75">
                <span>
                  {isRefreshingPreview
                    ? "Actualizando vista previa"
                    : hasPreview
                      ? (isPreviewPlaying ? "Reproduciendo" : "Reproducí vista previa")
                      : "Sin vista previa"}
                </span>
                <span>
                  {formatAudioTime(previewCurrentTime)} / {formatAudioTime(previewDuration)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] transition-all duration-150"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, previewDuration > 0 ? (previewCurrentTime / previewDuration) * 100 : 0)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={onVote}
            disabled={isVoting}
            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_10px_24px_rgba(0,0,0,0.5)] transition-all hover:brightness-110 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
            style={{
              background: `${color}`,
              borderColor: "#1a1a1a",
            }}
          >
            {voteLabel}
          </button>
        </div>
      </motion.div>
    </section>
  )
}
