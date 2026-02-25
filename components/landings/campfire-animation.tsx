"use client"

import { motion } from "framer-motion"

export function CampfireAnimation() {
  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="absolute bottom-2 h-36 w-36 rounded-full bg-campfire-orange/25 blur-3xl" />
      <div className="absolute -top-1 z-20 rounded-full border-2 border-campfire-orange/70 bg-neon-yellow/90 px-4 py-1 text-4xl font-black text-carbon shadow-[0_0_24px_rgba(255,102,0,0.4)]">
        VS
      </div>

      <motion.div
        className="relative h-44 w-32"
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
          className="absolute bottom-7 left-1/2 h-12 w-10 -translate-x-1/2 rounded-full bg-neon-yellow/80 blur-sm"
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
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

      <div className="relative mt-2">
        <svg width="110" height="32" viewBox="0 0 110 32" fill="none" className="opacity-90">
          <ellipse cx="34" cy="23" rx="24" ry="8" fill="#4a2c1a" />
          <ellipse cx="76" cy="23" rx="24" ry="8" fill="#3d2215" />
          <ellipse cx="55" cy="18" rx="22" ry="7" fill="#5a3520" />
        </svg>
      </div>
    </div>
  )
}
