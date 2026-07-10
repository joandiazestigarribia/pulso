"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Copy, Mail, Send } from "lucide-react"
import { requestPasswordResetSchema } from "@/lib/auth-validation"
import { requestPasswordReset } from "@/lib/auth-client"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resetUrl, setResetUrl] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setResetUrl(null)
    setFieldErrors({})

    const parsedInput = requestPasswordResetSchema.safeParse({ email })
    if (!parsedInput.success) {
      setFieldErrors(parsedInput.error.flatten().fieldErrors)
      setError("Revisá los campos marcados.")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await requestPasswordReset({ email: parsedInput.data.email })
      if (!response.ok) {
        setFieldErrors(response.errors ?? {})
        setError(response.message ?? "No pudimos iniciar el restablecimiento.")
        return
      }

      setMessage(response.message ?? "Si existe una cuenta con ese correo, vas a recibir instrucciones.")
      setResetUrl(response.resetUrl ?? null)
    } catch {
      setError("Error de red al solicitar el restablecimiento.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyResetUrl = async () => {
    if (!resetUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(resetUrl)
      setMessage("Link de restablecimiento copiado.")
    } catch {
      setError("No se pudo copiar el link automáticamente.")
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
      <div className="rounded-[30px_16px_24px_14px] border border-[#00f0ff]/30 bg-[#111739]/82 p-7 pt-9 shadow-[0_10px_18px_rgba(0,0,0,0.28)] ring-1 ring-[#00f0ff]/15 backdrop-blur-sm">
        <div className="mb-5 flex justify-center">
          <span className="rounded-full bg-[#00f0ff]/25 px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#d7faff] ring-1 ring-[#00f0ff]/45">
            Restablecer acceso
          </span>
        </div>

        <h1 className="bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-center text-3xl font-black uppercase leading-none tracking-tight text-transparent">
          Olvidé mi clave
        </h1>
        <p className="mb-8 mt-2 text-center text-sm font-semibold text-[#d8e9ff]">
          Ingresá tu correo y te indicamos cómo crear una clave nueva.
        </p>

        <div className="mb-6">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#7be3ff]">
            Email
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`w-full rounded-xl border bg-[#0b102a] px-4 py-3.5 pr-12 text-sm font-semibold text-[#eaf7ff] placeholder:text-[#90a8c3] focus:outline-none focus:ring-2 ${
                fieldErrors.email
                  ? "border-[#ff6c7b]/60 focus:ring-[#ff6c7b]/60"
                  : "border-[#00f0ff]/24 focus:ring-[#00f0ff]/50"
              }`}
            />
            <Mail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8ba0bf]" />
          </div>
          {fieldErrors.email ? (
            <p className="mt-2 text-xs font-semibold text-[#ffb3bd]">{fieldErrors.email[0]}</p>
          ) : null}
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-center gap-3 rounded-lg border bg-gradient-to-r from-[#00ff66] to-[#00f0ff] p-2.5 text-xs font-black uppercase tracking-wide text-black shadow-[0_10px_24px_rgba(0,0,0,0.5)] transition-colors hover:brightness-110 disabled:opacity-70"
        >
          {isSubmitting ? "Enviando..." : "Solicitar restablecimiento"}
          <Send className="h-4 w-4" />
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
