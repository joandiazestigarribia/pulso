"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getMe, installAuthUnauthorizedInterceptor } from "@/lib/auth-client"

export function AuthSessionBootstrap() {
  const router = useRouter()

  useEffect(() => {
    const uninstallInterceptor = installAuthUnauthorizedInterceptor()

    void getMe()

    const handleSessionExpired = () => {
      router.push("/login?reason=session_expired")
      router.refresh()
    }

    window.addEventListener("pulso:session-expired", handleSessionExpired)

    return () => {
      window.removeEventListener("pulso:session-expired", handleSessionExpired)
      uninstallInterceptor()
    }
  }, [router])

  return null
}
