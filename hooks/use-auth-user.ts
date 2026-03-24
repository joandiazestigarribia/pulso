"use client"

import { useEffect, useState } from "react"
import { readAuthUserFromStorage, type AuthUser } from "@/lib/auth-client"

export function useAuthUser(): {
  user: AuthUser | null
  isAuthenticated: boolean
} {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const syncUser = () => {
      setUser(readAuthUserFromStorage())
    }

    syncUser()
    window.addEventListener("storage", syncUser)
    window.addEventListener("pulso:auth-user-updated", syncUser)

    return () => {
      window.removeEventListener("storage", syncUser)
      window.removeEventListener("pulso:auth-user-updated", syncUser)
    }
  }, [])

  return {
    user,
    isAuthenticated: Boolean(user),
  }
}
