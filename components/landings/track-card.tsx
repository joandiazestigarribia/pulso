"use client"

import { motion } from "framer-motion"
import { Play, Pause } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import type { Track } from "@/lib/mock-data"

interface TrackCardProps {
  track: Track
  side: "left" | "right"
  onVote: () => void
  isVoting: boolean
  voteResult: "winner" | "loser" | null
}

export function TrackCard({ track, side, onVote, isVoting, voteResult }: TrackCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const borderColor = side === "left" ? "border-campfire-pink" : "border-campfire-lime"
  const glowClass = side === "left" ? "glow-magenta" : "glow-lime"
  const buttonBg = side === "left" 
    ? "bg-gradient-to-r from-campfire-pink to-campfire-hotpink" 
    : "bg-gradient-to-r from-campfire-lime to-neon-green"
  const buttonText = side === "left" ? "text-white" : "text-carbon"
  const voteLabel = side === "left" ? "Vote Left" : "Vote Right"

  const exitAnimation = voteResult === "loser"
    ? { opacity: 0, x: side === "left" ? -100 : 100, filter: "blur(10px)" }
    : voteResult === "winner"
    ? { scale: [1, 1.08, 1] }
    : {}

  return (
    <motion.div
      className="flex flex-col items-center gap-4 w-full"
      initial={{ opacity: 0, y: 40 }}
      animate={
        voteResult === "loser"
          ? exitAnimation
          : voteResult === "winner"
          ? { opacity: 1, y: 0, scale: [1, 1.08, 1] }
          : { opacity: 1, y: 0 }
      }
      transition={
        voteResult
          ? { duration: 0.6 }
          : { duration: 0.6, type: "spring", stiffness: 120 }
      }
    >
      <motion.div
        className={`relative bg-carbon-light/80 backdrop-blur-sm border-2 ${borderColor} rounded-2xl p-4 w-full max-w-xs ${glowClass}`}
        whileHover={!isVoting ? { scale: 1.03, rotateY: side === "left" ? 3 : -3 } : {}}
        style={{ transformStyle: "preserve-3d" }}
      >
        {isPlaying && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-carbon/80 backdrop-blur px-2 py-1 rounded-full">
            <div className="flex items-end gap-0.5 h-3">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-neon-green rounded-full"
                  animate={{ height: ["4px", "12px", "4px"] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-foreground uppercase tracking-wider">
              Playing Snippet
            </span>
          </div>
        )}

        <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-carbon">
          <Image
            src={track.albumImage}
            alt={`${track.name} by ${track.artist}`}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute inset-0 flex items-center justify-center bg-carbon/30 opacity-0 hover:opacity-100 transition-opacity"
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
          >
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </div>
          </button>
        </div>

        <h3 className="font-sans text-lg font-bold text-foreground leading-tight">{track.name}</h3>
        <p className="font-sans text-sm text-foreground/60 mb-3">{track.artist}</p>

        <div className="flex flex-wrap gap-2">
          <span className="font-mono text-[10px] tracking-wider uppercase bg-carbon-lighter px-2.5 py-1 rounded-full text-foreground/70 border border-carbon-lighter">
            {track.bpm} BPM
          </span>
          <span className="font-mono text-[10px] tracking-wider uppercase bg-carbon-lighter px-2.5 py-1 rounded-full text-foreground/70 border border-carbon-lighter">
            {track.duration}
          </span>
          <span className="font-mono text-[10px] tracking-wider uppercase bg-carbon-lighter px-2.5 py-1 rounded-full text-foreground/70 border border-carbon-lighter">
            {track.genre}
          </span>
        </div>
      </motion.div>

      <motion.button
        onClick={onVote}
        disabled={isVoting}
        whileHover={!isVoting ? { scale: 1.05 } : {}}
        whileTap={!isVoting ? { scale: 0.95 } : {}}
        className={`${buttonBg} ${buttonText} font-mono font-black text-sm uppercase tracking-widest px-8 py-3 rounded-full transition-all disabled:opacity-50`}
        style={{
          boxShadow: side === "left" 
            ? "0 4px 20px rgba(255, 0, 255, 0.3)" 
            : "0 4px 20px rgba(57, 255, 20, 0.3)",
        }}
      >
        {voteLabel}
      </motion.button>
    </motion.div>
  )
}
