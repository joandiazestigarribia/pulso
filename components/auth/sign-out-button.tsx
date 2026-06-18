"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { clearAuthUser, logout } from "@/lib/auth-client"

export function SignOutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    if (isLoading) {
      return
    }

    setIsLoading(true)

    try {
      await signOut({ redirect: false })
      await logout()
      await fetch("/api/identity/logout", { method: "POST" })
    } finally {
      clearAuthUser()
      router.push("/login")
      router.refresh()
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isLoading}
      className="rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white/90 transition-colors hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? "Saliendo..." : "Salir"}
    </button>
  )
}
