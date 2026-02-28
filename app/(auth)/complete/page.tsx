"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { getSafeNextPath } from "@/lib/safe-redirect"

export default function CompleteAuthPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const finalize = async () => {
      const url = new URL(window.location.href)
      const nextPath = getSafeNextPath(url.searchParams.get("next"))

      try {
        const response = await fetch("/api/identity/finalize", {
          method: "POST",
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { message?: string; code?: string }
            | null
          if (response.status === 401 && payload?.code === "AUTH_REQUIRED") {
            router.replace("/login")
            router.refresh()
            return
          }
          const message = payload?.message
            ? `${payload.message}${payload.code ? ` (${payload.code})` : ""}`
            : "Could not finalize Spotify login. Please retry."
          setError(message)
          return
        }

        const payload = (await response.json()) as {
          spotifyTokenError?: string | null
        }

        if (payload.spotifyTokenError) {
          setError("Spotify token refresh failed. Reconnect your account.")
          return
        }

        router.replace(nextPath)
        router.refresh()
      } catch {
        setError("Network error while finalizing Spotify login.")
      }
    }

    void finalize()
  }, [router])

  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-carbon-lighter bg-carbon-light/90 p-8 text-center">
        <h1 className="mb-3 font-mono text-2xl font-black uppercase tracking-wide text-foreground">
          Finalizing Access
        </h1>
        <p className="mb-6 text-sm text-foreground/70">
          We are linking your Spotify identity and battle history.
        </p>

        <motion.div
          className="mx-auto h-8 w-8 rounded-full border-2 border-neon-green/30 border-t-neon-green"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />

        {error && (
          <p className="mt-5 rounded-lg border border-red-400/30 bg-red-900/20 px-3 py-2 text-xs text-red-100">
            {error}
          </p>
        )}
      </div>
    </main>
  )
}
