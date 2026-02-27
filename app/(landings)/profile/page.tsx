"use client"

import { motion } from "framer-motion"
import { Lock, Zap } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((response) => response.json())

interface BattleStatsResponse {
  completedBattlesCount: number
}

export default function ProfilePage() {
  const { data: stats } = useSWR<BattleStatsResponse>("/api/battle/stats?userId=guest", fetcher, {
    revalidateOnFocus: false,
  })

  const battlesCompleted = stats?.completedBattlesCount ?? 0
  const battlesRequired = 10

  return (
    <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-16 pb-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-carbon-light/80 backdrop-blur-xl border border-campfire-purple/30 rounded-3xl p-8 text-center">
          <div className="relative mx-auto w-32 h-32 mb-6">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-campfire-purple/40"
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-3 rounded-full border border-campfire-pink/30"
              animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.3 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-carbon-lighter flex items-center justify-center border border-campfire-purple/30">
                <Lock className="w-7 h-7 text-campfire-purple/70" />
              </div>
            </div>
          </div>

          <h1 className="font-mono font-black text-2xl uppercase tracking-wider text-foreground mb-3">
            Music DNA
          </h1>
          <h2 className="font-mono font-bold text-sm uppercase tracking-widest text-campfire-purple mb-6">
            Profile Locked
          </h2>

          <p className="font-sans text-sm text-foreground/60 mb-6 leading-relaxed">
            Complete{" "}
            <span className="text-campfire-pink font-bold">
              {Math.max(0, battlesRequired - battlesCompleted)} more battles
            </span>{" "}
            to unlock your unique Music DNA archetype and sonic profile.
          </p>

          <div className="mb-6">
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-foreground/50 mb-2">
              <span>Progress</span>
              <span>{battlesCompleted}/{battlesRequired} Battles</span>
            </div>
            <div className="h-2 bg-carbon-lighter rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-campfire-pink to-campfire-purple rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(battlesCompleted / battlesRequired) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>

          <Link href="/battle">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 rounded-2xl font-mono font-black text-sm uppercase tracking-wider text-carbon bg-gradient-to-r from-campfire-lime to-neon-green flex items-center justify-center gap-2 cursor-pointer"
              style={{ boxShadow: "0 4px 20px rgba(57, 255, 20, 0.2)" }}
            >
              Continue Battling
              <Zap className="w-4 h-4" />
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
