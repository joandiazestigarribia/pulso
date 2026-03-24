"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, KeyRound, Mail, Zap } from "lucide-react"
import { getSafeNextPath } from "@/lib/safe-redirect"
import { trackClientEvent } from "@/lib/client-events"

export function RegisterForm() {
  const router = useRouter()
  const [callsign, setCallsign] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void trackClientEvent({
      eventName: "auth_prompt_shown",
      variant: "register_form",
      metadata: {
        trigger: "register_page",
      },
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Las claves no coinciden.")
      return
    }

    setIsSubmitting(true)

    const nextPath = getSafeNextPath(new URL(window.location.href).searchParams.get("next"))

    try {
      const response = await fetch("/api/identity/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: callsign.trim(),
        }),
      })

      if (!response.ok) {
        setError("No se pudo crear la sesion. Usa un alias valido.")
        setIsSubmitting(false)
        return
      }

      const payload = (await response.json()) as {
        merge?: {
          movedBattles?: number
        }
      }
      const movedBattles = payload.merge?.movedBattles ?? 0
      const separator = nextPath.includes("?") ? "&" : "?"
      const redirectedPath = `${nextPath}${separator}auth=done&mergedBattles=${movedBattles}`

      router.push(redirectedPath)
      router.refresh()
    } catch {
      setError("Error de red al crear la sesion.")
      setIsSubmitting(false)
      return
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative mx-auto w-full max-w-md"
    >
      <motion.div
        className="absolute -left-4 -top-4 z-10 flex h-12 w-12 rotate-[-12deg] items-center justify-center rounded-2xl bg-[#00f0ff] shadow-[0_0_22px_rgba(0,240,255,0.35)]"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: -12 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <Zap className="h-6 w-6 text-[#0b1129]" />
      </motion.div>

      <div className="rounded-[30px_16px_24px_14px] border border-[#ff43f8]/30 bg-[#111739]/82 p-7 pt-9 shadow-[0_10px_18px_rgba(0,0,0,0.28)] ring-1 ring-[#ff43f8]/15 backdrop-blur-sm">
        <motion.div
          className="mb-5 flex justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        >
          <span className="rounded-full bg-[#00f0ff]/25 px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#d7faff] ring-1 ring-[#00f0ff]/45">
            Nueva cuenta
          </span>
        </motion.div>

        <h1 className="bg-gradient-to-r from-[#ff43f8] via-[#00f0ff] to-[#ffe600] bg-clip-text text-center text-3xl font-black uppercase leading-none tracking-tight text-transparent md:text-3xl">
          Registrarse
        </h1>

        <p className="mb-8 mt-2 text-center text-sm font-semibold text-[#d8e9ff]">
          Crea tu cuenta y guarda tu progreso.
        </p>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#7be3ff]">
            Alias
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ej. BassMaster99"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              className="w-full rounded-xl border border-[#00f0ff]/24 bg-[#0b102a] px-4 py-3.5 pr-12 text-sm font-semibold text-[#eaf7ff] placeholder:text-[#90a8c3] focus:outline-none focus:ring-2 focus:ring-[#00f0ff]/50"
            />
            <User className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8ba0bf]" />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#7be3ff]">
            Correo
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#00f0ff]/24 bg-[#0b102a] px-4 py-3.5 pr-12 text-sm font-semibold text-[#eaf7ff] placeholder:text-[#90a8c3] focus:outline-none focus:ring-2 focus:ring-[#00f0ff]/50"
            />
            <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8ba0bf]" />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#ffb5fb]">
            Clave
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#ff43f8]/24 bg-[#0b102a] px-4 py-3.5 pr-12 text-sm font-semibold text-[#eaf7ff] placeholder:text-[#90a8c3] focus:outline-none focus:ring-2 focus:ring-[#ff43f8]/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"}
            >
              <KeyRound className="h-5 w-5 text-[#8ba0bf]" />
            </button>
          </div>
        </div>

        <div className="mb-8">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#ffb5fb]">
            Confirmar clave
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-[#ff43f8]/24 bg-[#0b102a] px-4 py-3.5 pr-12 text-sm font-semibold text-[#eaf7ff] placeholder:text-[#90a8c3] focus:outline-none focus:ring-2 focus:ring-[#ff43f8]/50"
            />
            <KeyRound className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8ba0bf]" />
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#ff43f8]/45 bg-gradient-to-r from-[#ff2a6d] to-[#ffe600] p-2.5 text-xs font-black uppercase tracking-wide text-[#0b1129] shadow-[0_10px_24px_rgba(0,0,0,0.5)] transition-all hover:brightness-110 disabled:opacity-70"
        >
          {isSubmitting ? (
            <motion.div
              className="h-5 w-5 rounded-full border-2 border-[#0b1129]/30 border-t-[#0b1129]"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <>
              Registrarse
              <Zap className="w-5 h-5" />
            </>
          )}
        </motion.button>

        {error && (
          <p className="mt-4 rounded-lg border border-[#ff6c7b]/45 bg-[#2a0e19]/80 px-3 py-2 text-center text-xs font-bold text-[#ffd6dd]">
            {error}
          </p>
        )}

        <div className="mt-5 text-center">
          <Link
            href="/login"
            className="text-xs font-black uppercase tracking-[0.12em] text-[#ffb5fb] transition-colors hover:text-[#ff43f8]"
          >
            {"Ya tienes cuenta? Inicia sesion"}
          </Link>
        </div>
      </div>
    </motion.form>
  )
}
