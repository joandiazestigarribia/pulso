"use client"

import { motion } from "framer-motion"

export function CampfireAnimation() {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="absolute bottom-0 w-32 h-32 rounded-full bg-campfire-orange/20 blur-2xl" />

      <motion.div
        className="relative w-24 h-28"
        animate={{ scaleY: [1, 1.08, 1], scaleX: [1, 0.96, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 80 100" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="flame-outer" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ff6600" />
              <stop offset="50%" stopColor="#ff00ff" />
              <stop offset="100%" stopColor="#ff69b4" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <path
            d="M40 5 C55 25, 75 45, 70 70 C68 82, 55 95, 40 95 C25 95, 12 82, 10 70 C5 45, 25 25, 40 5Z"
            fill="url(#flame-outer)"
            opacity="0.8"
          />
        </svg>

        <motion.svg
          viewBox="0 0 80 100"
          className="absolute inset-0 w-full h-full"
          animate={{ scaleY: [0.9, 1.05, 0.9], y: [0, -2, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        >
          <defs>
            <linearGradient id="flame-inner" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ffea00" />
              <stop offset="60%" stopColor="#ff6600" />
              <stop offset="100%" stopColor="#ff00ff" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <path
            d="M40 20 C50 35, 62 50, 58 70 C56 80, 48 90, 40 90 C32 90, 24 80, 22 70 C18 50, 30 35, 40 20Z"
            fill="url(#flame-inner)"
            opacity="0.9"
          />
        </motion.svg>

        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-10 rounded-full bg-neon-yellow/80 blur-sm"
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      </motion.div>

      <motion.div
        className="absolute top-1/2 -translate-y-1/2 font-mono font-black text-3xl tracking-wider z-10"
        style={{
          textShadow: "0 0 10px #ff6600, 0 0 30px #ff00ff, 0 0 60px #ff6600",
          color: "#ffea00",
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        VS
      </motion.div>

      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 2 === 0 ? "#ffea00" : "#ff6600",
            left: `${35 + Math.random() * 30}%`,
            bottom: "30%",
          }}
          animate={{
            y: [0, -80 - Math.random() * 60],
            x: [0, (Math.random() - 0.5) * 40],
            opacity: [1, 0],
            scale: [1, 0.3],
          }}
          transition={{
            duration: 1.5 + Math.random() * 1.5,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}

      <div className="relative mt-1">
        <svg width="80" height="24" viewBox="0 0 80 24" fill="none" className="opacity-80">
          <ellipse cx="22" cy="18" rx="18" ry="6" fill="#4a2c1a" />
          <ellipse cx="58" cy="18" rx="18" ry="6" fill="#3d2215" />
          <ellipse cx="40" cy="14" rx="16" ry="5" fill="#5a3520" />
        </svg>
      </div>
    </div>
  )
}
