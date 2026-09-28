"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { HelpCircle, Music2, Trophy, X } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { GUESS_ROUND_COUNT } from "@/lib/guess-config"
import { useFocusTrap } from "@/components/landings/guess/use-focus-trap"
import type { GuessLeaderboardEntry } from "@/components/landings/guess/use-guess-flow"

interface PreviewTrack {
  id: string
  name: string
  artist: string
  albumImage: string
}

interface RoundPreviewPair {
  correctTrack: PreviewTrack
  decoyTrack: PreviewTrack
}

interface GuessProgressBannerProps {
  roundIndex: number
  totalRounds: number
}

export function GuessProgressBanner({ roundIndex, totalRounds }: GuessProgressBannerProps) {
  const completed = Math.min(roundIndex, totalRounds)
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      className="w-full"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: "easeOut" }}
    >
      <div className="mx-auto mb-3 flex w-full max-w-205 flex-col gap-1.5 rounded-2xl border border-white/15 bg-black/45 px-4 py-2.5 backdrop-blur">
        <p className="font-mono text-xs font-black uppercase tracking-[0.12em] text-[#f8eeaf]">
          Ronda {Math.min(completed + 1, totalRounds)}/{totalRounds}
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600]"
            initial={prefersReducedMotion ? false : { width: 0 }}
            animate={{ width: `${Math.min(100, (completed / totalRounds) * 100)}%` }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  )
}

interface GuessNicknameModalProps {
  title: string
  isSubmitting: boolean
  error: string | null
  onSubmit: (nickname: string) => void
}

export function GuessNicknameModal({ title, isSubmitting, error, onSubmit }: GuessNicknameModalProps) {
  const [nickname, setNickname] = useState("")
  const prefersReducedMotion = useReducedMotion()
  const dialogRef = useFocusTrap(true)

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="guess-nickname-title"
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        ref={dialogRef}
        className="w-full max-w-120 rounded-3xl border-2 border-[#00f0ff]/40 bg-[#0f1638]/95 p-5 text-[#eaf7ff] shadow-[0_18px_54px_rgba(0,0,0,0.5)]"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: "easeOut" }}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7be3ff]">¿Cuánto conocés a tu amigo?</p>
        <h3
          id="guess-nickname-title"
          className="mt-1 bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-xl font-black uppercase leading-tight text-transparent"
        >
          {title}
        </h3>
        <p className="mt-3 text-sm font-semibold text-[#d8ebff]">
          Elegí un nombre para aparecer en el ranking de esta lista.
        </p>

        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (nickname.trim().length > 0) {
              onSubmit(nickname.trim())
            }
          }}
        >
          <label
            htmlFor="guess-nickname"
            className="block text-xs font-black uppercase tracking-[0.12em] text-[#7be3ff]"
          >
            Tu nombre
          </label>
          <input
            id="guess-nickname"
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            maxLength={40}
            placeholder="Ej: Joan"
            autoFocus
            className="h-11 rounded-xl border border-white/25 bg-black/40 px-3 text-sm font-semibold text-white outline-none placeholder:text-white/40 focus:border-[#00f0ff]/60 focus-visible:ring-2 focus-visible:ring-[#00f0ff]/50"
          />

          {error ? <p className="text-sm font-semibold text-[#ffb5c4]">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting || nickname.trim().length === 0}
            className="flex h-11 w-full items-center justify-center rounded-xl border-2 border-[#1a1a1a] bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_10px_24px_rgba(0,0,0,0.5)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1638] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Empezando..." : "Empezar a jugar"}
          </button>
        </form>
      </motion.div>
    </section>
  )
}

interface GuessHowToPlayModalProps {
  isOpen: boolean
  onClose: () => void
}

const guessHelpItems = [
  {
    title: "Elegí la canción real",
    description: "En cada ronda vas a ver 2 canciones: una está en la lista de tu amigo, la otra no. Adiviná cuál es la verdadera.",
    Icon: Music2,
  },
  {
    title: "Sin pistas de más",
    description: "No te mostramos cuál es la correcta hasta que elijas. Así el resultado refleja lo que realmente sabés.",
    Icon: HelpCircle,
  },
  {
    title: "Competí en el ranking",
    description: "Al terminar vas a ver tu porcentaje de aciertos y tu lugar en el ranking de esta lista.",
    Icon: Trophy,
  },
]

export function GuessHowToPlayModal({ isOpen, onClose }: GuessHowToPlayModalProps) {
  const prefersReducedMotion = useReducedMotion()
  const dialogRef = useFocusTrap(isOpen)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <motion.section
      role="dialog"
      aria-modal="true"
      aria-labelledby="guess-help-title"
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: "easeOut" }}
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-140 flex-col overflow-hidden rounded-3xl border-2 border-[#00f0ff]/40 bg-[#0f1638]/94 p-3 text-[#eaf7ff] shadow-[0_18px_54px_rgba(0,0,0,0.5)] sm:max-h-[calc(100vh-2rem)] sm:p-4"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#00f0ff]/25 pb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7be3ff]">Guía rápida</p>
            <h3
              id="guess-help-title"
              className="mt-1 bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-xl font-black uppercase leading-none text-transparent sm:text-2xl"
            >
              ¿Cuánto lo conocés?
            </h3>
          </div>
          <motion.button
            type="button"
            onClick={onClose}
            autoFocus
            whileHover={prefersReducedMotion ? undefined : { scale: 1.06 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/30 text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
            aria-label="Cerrar ayuda"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-[#00f0ff]/28 bg-[#121a40]/78 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="space-y-3">
            {guessHelpItems.map(({ title, description, Icon }) => (
              <div
                key={title}
                className="flex gap-3 rounded-2xl border border-white/12 bg-black/18 px-3 py-3 shadow-[inset_0_0_0_1px_rgba(0,240,255,0.08)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#ff43f8]/35 bg-[#111739]/90 text-[#7be3ff]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black uppercase tracking-[0.08em] text-white">{title}</p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-[#d8ebff]">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            className="rounded-2xl border border-[#00f0ff]/55 bg-[#00f0ff]/20 px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_22px_rgba(0,240,255,0.18)] transition hover:bg-[#00f0ff]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
          >
            Entendido
          </motion.button>
        </div>
      </motion.div>
    </motion.section>
  )
}

interface GuessLeaderboardTableProps {
  entries: GuessLeaderboardEntry[] | null
  highlightAttemptId?: string
}

export function GuessLeaderboardTable({ entries, highlightAttemptId }: GuessLeaderboardTableProps) {
  if (entries === null) {
    return <p className="text-center text-sm font-semibold text-white/70">Cargando ranking...</p>
  }

  if (entries.length === 0) {
    return (
      <p className="text-center text-sm font-semibold text-white/70">
        Todavía nadie completó esta lista. ¡Sé el primero en aparecer en el ranking!
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/35">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-[#7be3ff]">#</TableHead>
            <TableHead className="text-[#7be3ff]">Amigo</TableHead>
            <TableHead className="text-right text-[#7be3ff]">Aciertos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => {
            const isHighlighted = highlightAttemptId !== undefined && entry.attemptId === highlightAttemptId

            return (
              <TableRow
                key={entry.attemptId}
                className={`border-white/10 ${isHighlighted ? "bg-[#00f0ff]/10" : "hover:bg-white/5"}`}
              >
                <TableCell className="font-mono font-black text-[#f8eeaf]">{index + 1}</TableCell>
                <TableCell className="font-semibold text-white">{entry.nickname}</TableCell>
                <TableCell className="text-right font-mono font-black text-[#eaf7ff]">
                  {entry.score}/{entry.totalRounds} · {entry.percentage}%
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function PreviewTrackChip({ track, tone }: { track: PreviewTrack; tone: "correct" | "decoy" }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-2 py-1.5">
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-white/15">
        <Image src={track.albumImage} alt="" fill sizes="32px" className="object-cover" />
      </div>
      <div className="min-w-0">
        <p className={`text-[9px] font-black uppercase tracking-wide ${tone === "correct" ? "text-[#7bffb0]" : "text-white/45"}`}>
          {tone === "correct" ? "Real" : "Señuelo"}
        </p>
        <p className="truncate text-xs font-bold text-white">{track.name}</p>
      </div>
    </div>
  )
}

interface GuessPublishConfirmModalProps {
  isOpen: boolean
  isPublishing: boolean
  previewPairs: RoundPreviewPair[] | null
  previewError: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function GuessPublishConfirmModal({
  isOpen,
  isPublishing,
  previewPairs,
  previewError,
  onCancel,
  onConfirm,
}: GuessPublishConfirmModalProps) {
  const prefersReducedMotion = useReducedMotion()
  const dialogRef = useFocusTrap(isOpen)

  useEffect(() => {
    if (!isOpen || isPublishing) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen, isPublishing, onCancel])

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="guess-publish-title"
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            ref={dialogRef}
            className="w-full max-w-130 rounded-3xl border-[3px] border-[#ff806d]/35 bg-[#0f1638]/94 p-4 text-[#eaf7ff] shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
            initial={prefersReducedMotion ? false : { y: 10, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { y: 10, scale: 0.98, opacity: 0 }}
          >
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#ffd2c9]">Publicar lista</p>
            <h3
              id="guess-publish-title"
              className="mt-1 bg-gradient-to-r from-[#ff806d] via-[#ff43f8] to-[#ffe600] bg-clip-text text-lg font-black uppercase leading-tight text-transparent"
            >
              Después de esto no se puede editar
            </h3>
            <p className="mt-2 text-sm font-semibold text-[#d8ebff]">
              Se generan las {GUESS_ROUND_COUNT} rondas y quedan fijas para que el ranking sea justo entre todos tus
              amigos. Así se van a ver un par de rondas de ejemplo:
            </p>

            <div className="mt-3 space-y-2">
              {previewError ? (
                <p className="rounded-lg border border-[#ff6c7b]/40 bg-[#2a0e19]/70 px-3 py-2 text-xs font-semibold text-[#ffd6dd]">
                  {previewError}
                </p>
              ) : previewPairs === null ? (
                <p className="text-xs font-semibold text-white/60">Generando vista previa...</p>
              ) : (
                previewPairs.map((pair, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <PreviewTrackChip track={pair.correctTrack} tone="correct" />
                    <span className="shrink-0 text-[10px] font-black uppercase text-white/40">o</span>
                    <PreviewTrackChip track={pair.decoyTrack} tone="decoy" />
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isPublishing}
                autoFocus
                className="rounded-lg border border-[#7be3ff]/35 bg-[#0d1636]/72 px-3 py-2 text-xs font-black uppercase tracking-wide text-[#d8ebff] transition-colors hover:border-[#00f0ff]/55 hover:text-[#eaf7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Seguir editando
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isPublishing}
                className="rounded-lg border border-[#ff806d]/45 bg-[#2f1419]/75 px-3 py-2 text-xs font-black uppercase tracking-wide text-[#ffd2c9] transition-all hover:border-[#ff806d]/80 hover:bg-[#3a1820] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff806d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPublishing ? "Publicando..." : "Sí, publicar"}
              </button>
            </div>
          </motion.div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  )
}
