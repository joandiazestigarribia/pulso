"use client"

import { Flame } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { SignOutButton } from "@/components/auth/sign-out-button"

interface AuthSessionResponse {
  isAuthenticated: boolean
}

const fetcher = async (url: string): Promise<AuthSessionResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    return { isAuthenticated: false }
  }

  const payload = (await response.json()) as { isAuthenticated?: unknown }
  return {
    isAuthenticated: payload.isAuthenticated === true,
  }
}

function resolveNavItemClass(pathname: string, href: string, activeColor: string, hoverColor: string): string {
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  if (isActive) {
    return `${activeColor} underline underline-offset-4`
  }

  return `${activeColor}/85 transition-colors hover:${hoverColor}`
}

export function CampgroundHeader() {
  const pathname = usePathname()
  const { data: session } = useSWR<AuthSessionResponse>("/api/identity/session", fetcher, {
    revalidateOnFocus: false,
  })

  const isAuthenticated = session?.isAuthenticated === true
  const showSignIn = !isAuthenticated && pathname !== "/login"
  const showRegister = !isAuthenticated && pathname !== "/register"

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-4">
      <div className="mx-auto flex w-full max-w-300 items-center justify-between gap-10 rounded-2xl border border-white/15 bg-[#111739]/74 px-4 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(130deg,#00f0ff,#ff43f8,#ffe600)] shadow-[0_0_16px_rgba(0,240,255,0.55)]">
            <Flame className="h-4 w-4 text-[#0b1129]" />
          </div>
          <Link
            href="/battle"
            className="truncate bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-lg font-black uppercase leading-none tracking-wide text-transparent"
          >
            Pulso Campfire
          </Link>
        </div>

        <nav className="hidden items-center gap-5 text-xs font-black uppercase tracking-[0.12em] md:flex">
          <Link
            href="/battle"
            className={resolveNavItemClass(pathname, "/battle", "text-[#7be3ff]", "text-[#00f0ff]")}
          >
            The Arena
          </Link>
          <Link
            href="/music-dna"
            className={resolveNavItemClass(pathname, "/music-dna", "text-[#ffb5fb]", "text-[#ff43f8]")}
          >
            Sonic Persona
          </Link>
          <Link
            href="/profile"
            className={resolveNavItemClass(pathname, "/profile", "text-[#f8eeaf]", "text-[#ffe600]")}
          >
            Battle History
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {showSignIn ? (
            <Link
              href="/login"
              className="rounded-lg border bg-gradient-to-r from-[#00ff66] to-[#00f0ff] text-black shadow-[0_10px_24px_rgba(0,0,0,0.5)] py-1.25 px-2.5 text-xs font-black uppercase tracking-wide transition-colors hover:brightness-110"
            >
              Sign in
            </Link>
          ) : null}
          {showRegister ? (
            <Link
              href="/register"
              className="rounded-lg border border-[#ff43f8]/45 bg-gradient-to-r from-[#ff2a6d] to-[#ffe600] shadow-[0_10px_24px_rgba(0,0,0,0.5)] py-1.25 px-2.5 text-xs font-black uppercase tracking-wide text-[#0b1129] transition-all hover:brightness-110"
            >
              Register
            </Link>
          ) : null}
          {isAuthenticated ? <SignOutButton /> : null}
        </div>
      </div>
    </header>
  )
}
