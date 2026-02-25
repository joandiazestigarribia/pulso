"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, KeyRound, Mail, Zap } from "lucide-react"

export function RegisterForm() {
  const router = useRouter()
  const [callsign, setCallsign] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
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
        className="absolute -top-12 -left-8 w-16 h-16 rounded-2xl bg-neon-cyan flex items-center justify-center rotate-[-12deg] z-10"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: -12 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <Zap className="w-8 h-8 text-carbon" />
      </motion.div>

      <div className="bg-carbon-light/90 backdrop-blur-xl border border-carbon-lighter rounded-3xl p-8 pt-10">
        <motion.div
          className="flex justify-center mb-5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        >
          <span className="bg-neon-cyan text-carbon font-mono font-bold text-xs tracking-widest uppercase px-5 py-2 rounded-full">
            New Recruit
          </span>
        </motion.div>

        <h1 className="text-center font-mono font-black text-4xl md:text-5xl uppercase tracking-tight leading-none text-foreground mb-3">
          Get Your
          <br />
          Wristband
        </h1>

        <p className="text-center text-neon-cyan font-sans text-sm font-medium mb-8">
          Join the arena and start battling tracks.
        </p>

        <div className="mb-4">
          <label className="block font-mono text-xs font-bold tracking-widest uppercase text-neon-yellow mb-2">
            Choose Callsign
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. BassMaster99"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              className="w-full bg-white/95 text-carbon font-sans text-sm rounded-xl px-4 py-3.5 pr-12 placeholder:text-carbon/40 focus:outline-none focus:ring-2 focus:ring-neon-green/50 transition-all"
            />
            <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon/30" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-mono text-xs font-bold tracking-widest uppercase text-neon-yellow mb-2">
            Signal Frequency
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/95 text-carbon font-sans text-sm rounded-xl px-4 py-3.5 pr-12 placeholder:text-carbon/40 focus:outline-none focus:ring-2 focus:ring-neon-green/50 transition-all"
            />
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon/30" />
          </div>
        </div>

        <div className="mb-4">
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

        <div className="mb-8">
          <label className="block font-mono text-xs font-bold tracking-widest uppercase text-neon-yellow mb-2">
            Confirm Rhythm
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/95 text-carbon font-sans text-sm rounded-xl px-4 py-3.5 pr-12 placeholder:text-carbon/40 focus:outline-none focus:ring-2 focus:ring-neon-green/50 transition-all"
            />
            <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon/30" />
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
              Claim Wristband
              <Zap className="w-5 h-5" />
            </>
          )}
        </motion.button>

        <div className="text-center mt-5">
          <a
            href="/login"
            className="font-mono text-xs font-bold tracking-widest uppercase text-neon-magenta hover:text-neon-pink transition-colors text-glow-magenta"
          >
            {"Already Have a Wristband? Log In \u2192"}
          </a>
        </div>
      </div>
    </motion.form>
  )
}
