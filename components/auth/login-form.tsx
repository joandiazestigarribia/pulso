"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { KeyRound, Mail, Zap } from "lucide-react"
import { loginSchema } from "@/lib/auth-validation"
import { login } from "@/lib/auth-client"
import { getSafeNextPath } from "@/lib/safe-redirect"
import { trackClientEvent } from "@/lib/client-events"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void trackClientEvent({
      eventName: "auth_prompt_shown",
      variant: "login_form",
      metadata: {
        trigger: "login_page",
      },
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)

    const nextPath = getSafeNextPath(new URL(window.location.href).searchParams.get("next"))

    try {
      const parsedInput = loginSchema.safeParse({ email, password })
      if (!parsedInput.success) {
        setFieldErrors(parsedInput.error.flatten().fieldErrors)
        setError("Revisá los campos marcados.")
        setIsSubmitting(false)
        return
      }

      const response = await login({
        email: parsedInput.data.email,
        password: parsedInput.data.password,
      })

      if (!response.ok) {
        setFieldErrors(response.errors ?? {})
        setError(response.message ?? "No se pudo iniciar sesión.")
        setIsSubmitting(false)
        return
      }

      const separator = nextPath.includes("?") ? "&" : "?"
      const redirectedPath = `${nextPath}${separator}auth=done`

      router.push(redirectedPath)
      router.refresh()
    } catch {
      setError("Error de red al iniciar sesión.")
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
        className="absolute -left-4 -top-4 z-10 flex h-12 w-12 rotate-[-12deg] items-center justify-center rounded-2xl bg-[#ffe600] shadow-[0_0_22px_rgba(255,230,0,0.35)]"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: -12 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-[#0b1129]" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </motion.div>

      <div className="rounded-[30px_16px_24px_14px] border border-[#00f0ff]/30 bg-[#111739]/82 p-7 pt-9 shadow-[0_10px_18px_rgba(0,0,0,0.28)] ring-1 ring-[#00f0ff]/15 backdrop-blur-sm">
        <motion.div
          className="mb-5 flex justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        >
          <span className="rounded-full bg-[#ff43f8]/25 px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#ffd8ff] ring-1 ring-[#ff43f8]/45">
            Acceso
          </span>
        </motion.div>

        <h1 className="bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-center text-3xl font-black uppercase leading-none tracking-tight text-transparent md:text-3xl">
          Iniciar sesión
        </h1>

        <p className="mb-8 mt-2 text-center text-sm font-semibold text-[#d8e9ff]">
          Volvé a votar y accedé a tu perfil sonoro.
        </p>

        <div className="mb-5">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#7be3ff]">
            Email
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-xl border bg-[#0b102a] px-4 py-3.5 pr-12 text-sm font-semibold text-[#eaf7ff] placeholder:text-[#90a8c3] focus:outline-none focus:ring-2 ${
                fieldErrors.email
                  ? "border-[#ff6c7b]/60 focus:ring-[#ff6c7b]/60"
                  : "border-[#00f0ff]/24 focus:ring-[#00f0ff]/50"
              }`}
            />
            <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8ba0bf]" />
          </div>
          {fieldErrors.email && (
            <p className="mt-2 text-xs font-semibold text-[#ffb3bd]">{fieldErrors.email[0]}</p>
          )}
        </div>

        <div className="mb-8">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#ffb5fb]">
            Clave
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-xl border bg-[#0b102a] px-4 py-3.5 pr-12 text-sm font-semibold text-[#eaf7ff] placeholder:text-[#90a8c3] focus:outline-none focus:ring-2 ${
                fieldErrors.password
                  ? "border-[#ff6c7b]/60 focus:ring-[#ff6c7b]/60"
                  : "border-[#ff43f8]/24 focus:ring-[#ff43f8]/50"
              }`}
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
          {fieldErrors.password && (
            <p className="mt-2 text-xs font-semibold text-[#ffb3bd]">{fieldErrors.password[0]}</p>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-center gap-3 rounded-lg border bg-gradient-to-r from-[#00ff66] to-[#00f0ff] p-2.5 text-xs font-black uppercase tracking-wide text-black shadow-[0_10px_24px_rgba(0,0,0,0.5)] transition-colors hover:brightness-110 disabled:opacity-70"
        >
          {isSubmitting ? (
            <motion.div
              className="h-5 w-5 rounded-full border-2 border-[#0b1129]/30 border-t-[#0b1129]"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <>
              Iniciar sesión
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
            href="/register"
            className="text-xs font-black uppercase tracking-[0.12em] text-[#ffb5fb] transition-colors hover:text-[#ff43f8]"
          >
            {"¿No tenés cuenta? Registrate"}
          </Link>
        </div>
      </div>
    </motion.form>
  )
}
