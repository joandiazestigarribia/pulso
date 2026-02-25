"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Smile, KeyRound, Zap } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const [callsign, setCallsign] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    router.push("/battle")
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative w-full max-w-md mx-auto"
    >
      <motion.div
        className="absolute -top-12 -left-8 w-16 h-16 rounded-2xl bg-neon-yellow flex items-center justify-center rotate-[-12deg] z-10"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: -12 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-carbon" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </motion.div>

      <div className="bg-carbon-light/90 backdrop-blur-xl border border-carbon-lighter rounded-3xl p-8 pt-10">
        <motion.div
          className="flex justify-center mb-5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        >
          <span className="bg-neon-magenta text-white font-mono font-bold text-xs tracking-widest uppercase px-5 py-2 rounded-full">
            Welcome Back!
          </span>
        </motion.div>

        <h1 className="text-center font-mono font-black text-4xl md:text-5xl uppercase tracking-tight leading-none text-foreground mb-3">
          Festival
          <br />
          Check-In
        </h1>

        <p className="text-center text-neon-cyan font-sans text-sm font-medium mb-8">
          Grab your backstage pass to the arena.
        </p>

        <div className="mb-5">
          <label className="block font-mono text-xs font-bold tracking-widest uppercase text-neon-yellow mb-2">
            Your Callsign
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. BassMaster99"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              className="w-full bg-white/95 text-carbon font-sans text-sm rounded-xl px-4 py-3.5 pr-12 placeholder:text-carbon/40 focus:outline-none focus:ring-2 focus:ring-neon-green/50 transition-all"
            />
            <Smile className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon/30" />
          </div>
        </div>

        <div className="mb-8">
          <label className="block font-mono text-xs font-bold tracking-widest uppercase text-neon-yellow mb-2">
            Secret Rhythm
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/95 text-carbon font-sans text-sm rounded-xl px-4 py-3.5 pr-12 placeholder:text-carbon/40 focus:outline-none focus:ring-2 focus:ring-neon-green/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <KeyRound className="w-5 h-5 text-carbon/30" />
            </button>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-2xl font-mono font-black text-lg uppercase tracking-wider text-carbon bg-gradient-to-r from-neon-green to-neon-cyan glow-green transition-all disabled:opacity-70 flex items-center justify-center gap-3"
        >
          {isSubmitting ? (
            <motion.div
              className="w-5 h-5 border-2 border-carbon/30 border-t-carbon rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <>
              Enter the Arena
              <Zap className="w-5 h-5" />
            </>
          )}
        </motion.button>

        <div className="text-center mt-5">
          <a
            href="/register"
            className="font-mono text-xs font-bold tracking-widest uppercase text-neon-magenta hover:text-neon-pink transition-colors text-glow-magenta"
          >
            {"No Wristband? Sign Up Here \u2192"}
          </a>
        </div>
      </div>
    </motion.form>
  )
}
