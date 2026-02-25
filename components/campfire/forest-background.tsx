"use client"

import { motion } from "framer-motion"

export function ForestBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-campfire-deep" />

      {[...Array(30)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-0.5 h-0.5 rounded-full bg-white/60"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 40}%`,
          }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <svg
        className="absolute bottom-0 left-0 h-full w-1/4 text-campfire-deep"
        viewBox="0 0 200 800"
        preserveAspectRatio="xMinYMax slice"
        fill="none"
      >
        <path
          d="M0 800V0h10v300c20-30 40-60 70-80-10 30 0 50-10 70 30-20 50-60 80-70-10 40 5 60-5 90 20-10 40-50 60-50 0 40 10 60-10 90 20-5 35-30 50-40 0 50 10 80-20 120 15-10 30-20 40-30 0 60 5 100-15 150H0z"
          fill="#0a0d18"
        />
        <path
          d="M20 800V200c15-25 35-50 55-65-8 25 0 45-8 60 25-18 45-55 65-60-8 35 5 50-5 75 15-8 35-45 50-42 0 35 8 55-8 80 15-5 30-28 42-35 0 45 8 75-15 110 12-8 25-18 35-25 0 55 5 95-12 140H20z"
          fill="#0f1225"
          opacity="0.7"
        />
      </svg>

      <svg
        className="absolute bottom-0 right-0 h-full w-1/4 text-campfire-deep"
        viewBox="0 0 200 800"
        preserveAspectRatio="xMaxYMax slice"
        fill="none"
      >
        <path
          d="M200 800V0h-10v280c-20-25-45-55-70-70 10 25 0 45 10 65-30-15-55-55-80-65 10 35-5 55 5 80-20-10-40-45-60-45 0 35-10 55 10 85-20-5-35-30-50-35 0 45-10 75 20 115-15-10-30-20-40-25 0 55-5 95 15 145h205z"
          fill="#0a0d18"
        />
        <path
          d="M180 800V220c-15-20-30-45-50-55 8 20 0 40 8 55-22-15-40-50-58-55 8 30-5 48 5 70-18-8-35-40-48-38 0 30-8 50 8 75-18-5-30-25-40-30 0 40-8 68 15 100-12-8-25-18-35-22 0 50-5 88 12 130H180z"
          fill="#0f1225"
          opacity="0.7"
        />
      </svg>

      <div className="absolute bottom-0 left-0 right-0 h-32">
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f08] via-[#1a0f08]/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#2d1810] opacity-60">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 120px, rgba(0,0,0,0.15) 120px, rgba(0,0,0,0.15) 122px)',
          }} />
        </div>
      </div>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-campfire-orange/8 blur-3xl" />

      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`firefly-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: i % 2 === 0 ? '#ffea00' : '#39ff14',
            left: `${15 + Math.random() * 70}%`,
            top: `${20 + Math.random() * 50}%`,
          }}
          animate={{
            x: [0, 20 * (Math.random() - 0.5), 0],
            y: [0, -30 * Math.random(), 0],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        />
      ))}

      <svg
        className="absolute bottom-4 right-20 w-12 h-12 text-campfire-purple/20"
        viewBox="0 0 40 40"
        fill="currentColor"
      >
        <ellipse cx="20" cy="15" rx="12" ry="10" />
        <rect x="17" y="20" width="6" height="16" rx="2" />
      </svg>
      <svg
        className="absolute bottom-2 right-12 w-8 h-8 text-campfire-lime/15"
        viewBox="0 0 40 40"
        fill="currentColor"
      >
        <ellipse cx="20" cy="18" rx="9" ry="8" />
        <rect x="18" y="22" width="4" height="12" rx="2" />
      </svg>
    </div>
  )
}
