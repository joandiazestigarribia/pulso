"use client"

import { useEffect } from "react"
import Link from "next/link"
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion"
import { Share2, Sparkles } from "lucide-react"
import type { GuessAttemptSummary } from "@/components/landings/guess/use-guess-flow"
import { useCopyFeedback } from "@/components/landings/guess/use-copy-feedback"

/** Animates the score on a motion value so the count-up never re-renders the tree per frame. */
function useCountUp(target: number, durationMs: number, skip: boolean) {
  const value = useMotionValue(skip ? target : 0)
  const display = useTransform(value, (latest) => `${Math.round(latest)}%`)

  useEffect(() => {
    if (skip) {
      value.set(target)
      return
    }

    const controls = animate(value, target, {
      duration: durationMs / 1000,
      ease: [0.16, 1, 0.3, 1],
    })

    return () => controls.stop()
  }, [durationMs, skip, target, value])

  return display
}

interface GuessResultCardProps {
  playlistTitle: string
  summary: GuessAttemptSummary
  shareUrl: string
}

export function GuessResultCard({ playlistTitle, summary, shareUrl }: GuessResultCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const animatedPercentage = useCountUp(summary.percentage, 1200, Boolean(prefersReducedMotion))
  const { copied, markCopied } = useCopyFeedback()

  const handleShare = async () => {
    const shareText = `Conozco el gusto musical de ${playlistTitle} al ${summary.percentage}%. ¿Vos podés superarme?`

    if (navigator.share) {
      try {
        await navigator.share({ title: "¿Cuánto conocés a tu amigo?", text: shareText, url: shareUrl })
        return
      } catch {
        return
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      markCopied()
    } catch {
      // clipboard unavailable in this browser context; the share link stays in the address bar.
    }
  }

  return (
    <motion.div
      className="mx-auto w-full max-w-130 rounded-3xl border-2 border-[#00f0ff]/40 bg-[#0f1638]/92 p-6 text-center text-[#eaf7ff] shadow-[0_18px_54px_rgba(0,0,0,0.5)]"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7be3ff]">Conocés a {playlistTitle}</p>

      <motion.div className="mt-3 bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-7xl font-black leading-none text-transparent">
        {animatedPercentage}
      </motion.div>

      <p className="mt-3 text-sm font-semibold text-[#d8ebff]">
        Acertaste {summary.score} de {summary.totalRounds} canciones como {summary.nickname}.
      </p>

      <button
        type="button"
        onClick={handleShare}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1a1a1a] bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_10px_24px_rgba(0,0,0,0.5)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1638]"
      >
        <Share2 className="h-4 w-4" />
        {copied ? "¡Link copiado!" : "Retá a otro amigo"}
      </button>

      <Link
        href="/guess"
        className="mt-2.5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#ff43f8]/35 bg-[#ff43f8]/10 text-xs font-black uppercase tracking-[0.14em] text-[#ffd6fb] transition-colors hover:border-[#ff43f8]/60 hover:bg-[#ff43f8]/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff43f8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1638]"
      >
        <Sparkles className="h-3.5 w-3.5" />
        ¿Y vos? Armá tu propia lista
      </Link>
    </motion.div>
  )
}
