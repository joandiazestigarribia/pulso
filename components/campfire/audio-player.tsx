"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { SkipBack, Play, Pause, SkipForward, Heart, Volume2 } from "lucide-react"

interface AudioPlayerProps {
  trackName: string
  isPlaying: boolean
  onTogglePlay: () => void
}

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
      className="fixed bottom-0 left-0 right-0 z-50 bg-carbon-light/90 backdrop-blur-xl border-t border-campfire-deep"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
    >
      <div className="h-0.5 bg-carbon-lighter">
        <motion.div
          className="h-full bg-gradient-to-r from-campfire-lime to-neon-cyan"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-4 md:px-8 py-3">
        <div className="flex items-center gap-3">
          <button className="text-foreground/50 hover:text-foreground transition-colors" aria-label="Previous track">
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full border border-foreground/30 flex items-center justify-center text-foreground hover:bg-foreground/10 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
          <button className="text-foreground/50 hover:text-foreground transition-colors" aria-label="Next track">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 text-center mx-4">
          <p className="font-mono text-xs font-bold text-foreground uppercase tracking-wider truncate">
            {trackName}
          </p>
          <p className="font-mono text-[10px] text-campfire-lime">
            Previewing {formatTime(progress)} / 0:30
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLiked(!liked)}
            className="transition-colors"
            aria-label={liked ? "Unlike" : "Like"}
          >
            <Heart
              className={`w-4 h-4 ${liked ? "fill-campfire-pink text-campfire-pink" : "text-foreground/50"}`}
            />
          </button>

          <div className="hidden md:flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-foreground/50" />
            <div className="w-16 h-1 bg-carbon-lighter rounded-full">
              <div className="w-3/4 h-full bg-foreground/40 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
