"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { KeyRound, Zap } from "lucide-react"
import { evaluatePasswordRules, resetPasswordSchema } from "@/lib/auth-validation"
import { resetPassword } from "@/lib/auth-client"

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const passwordRules = evaluatePasswordRules(password)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setFieldErrors({})

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: ["Las claves no coinciden."] })
      setError("Las claves no coinciden.")
      return
    }

    const parsedInput = resetPasswordSchema.safeParse({ token, password })
    if (!parsedInput.success) {
      setFieldErrors(parsedInput.error.flatten().fieldErrors)
      setError("Revisá los campos marcados.")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await resetPassword(parsedInput.data)
      if (!response.ok) {
        setFieldErrors(response.errors ?? {})
        setError(response.message ?? "No pudimos restablecer tu clave.")
        return
      }

      setMessage(response.message ?? "Tu clave fue restablecida. Ya podés iniciar sesión.")
      setPassword("")
      setConfirmPassword("")
    } catch {
      setError("Error de red al restablecer tu clave.")
    } finally {
      setIsSubmitting(false)
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
      <div className="rounded-[30px_16px_24px_14px] border border-[#ff43f8]/30 bg-[#111739]/82 p-7 pt-9 shadow-[0_10px_18px_rgba(0,0,0,0.28)] ring-1 ring-[#ff43f8]/15 backdrop-blur-sm">
        <div className="mb-5 flex justify-center">
          <span className="rounded-full bg-[#ff43f8]/25 px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#ffd8ff] ring-1 ring-[#ff43f8]/45">
            Nueva clave
          </span>
        </div>

        <h1 className="bg-gradient-to-r from-[#ff43f8] via-[#00f0ff] to-[#ffe600] bg-clip-text text-center text-3xl font-black uppercase leading-none tracking-tight text-transparent">
          Restablecer clave
        </h1>
        <p className="mb-8 mt-2 text-center text-sm font-semibold text-[#d8e9ff]">
          Elegí una clave segura para volver a entrar.
        </p>

        {!token ? (
          <p className="mb-5 rounded-lg border border-[#ff6c7b]/45 bg-[#2a0e19]/80 px-3 py-2 text-center text-xs font-bold text-[#ffd6dd]">
            Falta el token de restablecimiento. Solicitá un nuevo link.
          </p>
        ) : null}

        <div className="mb-4">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#ffb5fb]">
            Nueva clave
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
          {fieldErrors.password ? (
            <p className="mt-2 text-xs font-semibold text-[#ffb3bd]">{fieldErrors.password[0]}</p>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-[#0b102a]/70 p-3">
            {[
              ["Mínimo 8 caracteres", passwordRules.minLength],
              ["Al menos una mayúscula", passwordRules.uppercase],
              ["Al menos una minúscula", passwordRules.lowercase],
              ["Al menos un número", passwordRules.number],
              ["Al menos un especial", passwordRules.special],
              ["Máximo 100 caracteres", passwordRules.maxLength],
            ].map(([label, isValid]) => (
              <p key={String(label)} className="flex items-center gap-2 text-[11px] font-medium text-[#cde3ff]">
                <span className={`h-2.5 w-2.5 rounded-full ${isValid ? "bg-[#7dffbe]" : "bg-[#60738d]"}`} />
                {label}
              </p>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#ffb5fb]">
            Confirmar clave
          </label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="********"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={`w-full rounded-xl border bg-[#0b102a] px-4 py-3.5 text-sm font-semibold text-[#eaf7ff] placeholder:text-[#90a8c3] focus:outline-none focus:ring-2 ${
              fieldErrors.confirmPassword
                ? "border-[#ff6c7b]/60 focus:ring-[#ff6c7b]/60"
                : "border-[#ff43f8]/24 focus:ring-[#ff43f8]/50"
            }`}
          />
          <p className={`mt-2 text-xs font-semibold ${passwordsMatch ? "text-[#7dffbe]" : "text-[#9fb0c6]"}`}>
            {passwordsMatch ? "Las claves coinciden." : "Las claves deben coincidir."}
          </p>
          {fieldErrors.confirmPassword ? (
            <p className="mt-1 text-xs font-semibold text-[#ffb3bd]">{fieldErrors.confirmPassword[0]}</p>
          ) : null}
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting || !token}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#ff43f8]/45 bg-gradient-to-r from-[#ff2a6d] to-[#ffe600] p-2.5 text-xs font-black uppercase tracking-wide text-[#0b1129] shadow-[0_10px_24px_rgba(0,0,0,0.5)] transition-all hover:brightness-110 disabled:opacity-70"
        >
          {isSubmitting ? "Restableciendo..." : "Restablecer clave"}
          <Zap className="h-4 w-4" />
        </motion.button>

        {message ? (
          <p className="mt-4 rounded-lg border border-[#00ff9f]/35 bg-[#06110f]/72 px-3 py-2 text-center text-xs font-bold text-[#aefbd8]">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-lg border border-[#ff6c7b]/45 bg-[#2a0e19]/80 px-3 py-2 text-center text-xs font-bold text-[#ffd6dd]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 text-center">
          <Link
            href="/login"
            className="text-xs font-black uppercase tracking-[0.12em] text-[#ffb5fb] transition-colors hover:text-[#ff43f8]"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </motion.form>
  )
}
