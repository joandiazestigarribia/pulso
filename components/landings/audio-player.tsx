"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Heart, Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react"

interface AudioPlayerProps {
  trackName: string
  isPlaying: boolean
  onTogglePlay: () => void
}

const visualizerDelays = [0, 0.1, 0.2, 0.3, 0.4, 0.5]

export function AudioPlayer({ trackName, isPlaying, onTogglePlay }: AudioPlayerProps) {
  const [progress, setProgress] = useState(25)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0
        return prev + 0.5
      })
    }, 100)
    return () => clearInterval(interval)
  }, [isPlaying])

  const formatTime = (pct: number) => {
    const totalSeconds = Math.floor((pct / 100) * 30)
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  return (
    <motion.div
      className="fixed bottom-4 left-1/2 z-50 w-[min(96vw,760px)] -translate-x-1/2 overflow-hidden rounded-[28px] border-4 border-black bg-[#111111]/95 text-white shadow-[0_8px_0_0_rgba(0,0,0,0.35),0_0_30px_rgba(0,240,255,0.22)] backdrop-blur-xl"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.35, type: "spring", stiffness: 120, damping: 20 }}
    >
      <div className="h-1 w-full bg-black">
        <motion.div
          className="h-full bg-gradient-to-r from-[#00F0FF] via-[#FFE600] to-[#FF2A6D]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-3 px-3 py-3 md:px-5">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            className="hidden h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-white text-black transition-colors hover:bg-[#FFE600] md:flex"
            aria-label="Previous track"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-black bg-[#00F0FF] text-black shadow-[0_4px_0_0_rgba(0,0,0,0.3)] transition-all hover:brightness-110 active:translate-y-[1px] active:shadow-none"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          </button>

          <button
            className="hidden h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-white text-black transition-colors hover:bg-[#FFE600] md:flex"
            aria-label="Next track"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <div className="min-w-0 flex-1 px-2">
          <p className="truncate text-center text-xs font-black uppercase tracking-[0.2em] text-[#00F0FF] md:text-sm">
            {trackName}
          </p>
          <p className="text-center font-mono text-[10px] font-semibold uppercase tracking-wider text-white/70 md:text-xs">
            Previewing {formatTime(progress)} / 0:30
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-end gap-1 md:flex">
            {visualizerDelays.map((delay, idx) => (
              <motion.span
                key={`${idx}-${delay}`}
                className="w-1 rounded-full"
                style={{ backgroundColor: idx % 2 === 0 ? "#FF2A6D" : "#00FF66" }}
                animate={{ height: [5, 14, 8, 16, 6] }}
                transition={{ duration: 0.7, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay }}
              />
            ))}
          </div>

          <button
            onClick={() => setLiked(!liked)}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-white text-black transition-colors hover:bg-[#FFE600]"
            aria-label={liked ? "Unlike" : "Like"}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-[#FF2A6D] text-[#FF2A6D]" : "text-black"}`} />
          </button>

          <div className="hidden items-center gap-2 rounded-full border-2 border-black bg-black px-2 py-1 md:flex">
            <Volume2 className="h-3.5 w-3.5 text-white/80" />
            <div className="h-1 w-14 rounded-full bg-white/15">
              <div className="h-full w-3/4 rounded-full bg-[#00F0FF]" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
