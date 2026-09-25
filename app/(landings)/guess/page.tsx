"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ListMusic, Plus } from "lucide-react"
import { motion } from "framer-motion"

interface PlaylistSummary {
  id: string
  title: string
  status: "DRAFT" | "PUBLISHED"
  roundCount: number
  trackCount: number
  eligibleTrackCount: number
}

const HOW_IT_WORKS_STEPS = [
  {
    label: "01",
    title: "Armá tu lista",
    description: "Buscá y elegí las canciones que más te representan.",
  },
  {
    label: "02",
    title: "Publicala",
    description: "Se generan 15 rondas y te damos un link para compartir.",
  },
  {
    label: "03",
    title: "Mirá el ranking",
    description: "Tus amigos adivinan y competís para ver quién te conoce mejor.",
  },
]

export default function GuessDashboardPage() {
  const router = useRouter()
  const [playlists, setPlaylists] = useState<PlaylistSummary[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/guess")
        const body = (await response.json().catch(() => null)) as PlaylistSummary[] | { error?: string } | null

        if (!response.ok || !Array.isArray(body)) {
          setLoadError("No pudimos cargar tus listas. Probá de nuevo en un momento.")
          return
        }

        setPlaylists(body)
      } catch {
        setLoadError("Error de red al cargar tus listas.")
      }
    })()
  }, [])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isCreating || title.trim().length === 0) {
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const response = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      })
      const body = (await response.json().catch(() => null)) as { id?: string } | null

      if (!response.ok || !body?.id) {
        setCreateError("No pudimos crear la lista. Probá de nuevo.")
        return
      }

      router.push(`/guess/${body.id}/edit`)
    } catch {
      setCreateError("Error de red al crear la lista.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <main className="relative mx-auto w-full max-w-7xl overflow-hidden px-4 pb-8 pt-24 text-[#eaf7ff] selection:bg-[#ff4ef5] selection:text-black">
      <div className="bg-scene-battle pointer-events-none fixed inset-0 z-0 opacity-90" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.14),transparent_45%),radial-gradient(circle_at_75%_15%,rgba(255,67,248,0.2),transparent_45%),linear-gradient(180deg,rgba(8,11,26,0.74),rgba(8,11,26,0.92))]" />

      <section className="relative z-10 mx-auto w-full max-w-200 space-y-6 py-6">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#00f0ff]/35 bg-[#090d25]/55 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#7be3ff] backdrop-blur-sm">
            Modo amigos
          </span>
          <h1 className="mt-4 bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-3xl font-black uppercase leading-none tracking-tight text-transparent md:text-4xl">
            ¿Cuánto te conocen?
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-[#d8ebff]">
            Armá una lista con tus canciones y retá a tus amigos a adivinar cuáles son. Al final se arma un ranking
            de quién te conoce mejor.
          </p>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f8eeaf]">Cómo funciona</p>
            <div className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <article
                key={step.label}
                className="rounded-2xl bg-[#090d25]/28 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffe600]">{step.label}</p>
                <h2 className="mt-2 text-lg font-black uppercase leading-tight text-white">{step.title}</h2>
                <p className="mt-2 text-sm font-semibold text-[#c7dbf2]">{step.description}</p>
              </article>
            ))}
          </div>
        </div>

        <form onSubmit={handleCreate} className="rounded-2xl border border-white/15 bg-black/35 p-4">
          <label
            htmlFor="guess-playlist-title"
            className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#7be3ff]"
          >
            Tu nombre
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="guess-playlist-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={80}
              placeholder="Ej: Joan"
              className="h-11 flex-1 rounded-xl border border-white/20 bg-black/40 px-3 text-sm font-semibold text-white outline-none placeholder:text-white/40 focus:border-[#00f0ff]/60 focus-visible:ring-2 focus-visible:ring-[#00f0ff]/50"
            />
            <button
              type="submit"
              disabled={isCreating || title.trim().length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#1a1a1a] bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] px-4 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_10px_24px_rgba(0,0,0,0.5)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1129] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? "Creando..." : "Crear lista"}
            </button>
          </div>
          <p className="mt-2 text-xs font-semibold text-white/55">
            Con ese nombre se comparte la lista para que tus amigos jueguen.
          </p>
        </form>
        {createError ? <p className="text-sm font-semibold text-[#ffb5c4]">{createError}</p> : null}

        {loadError ? (
          <div className="rounded-2xl border-2 border-[#ff4ef5]/45 bg-[#2a0e19]/80 px-5 py-3 text-sm font-bold text-[#ffd6dd]">
            {loadError}
          </div>
        ) : (
          <div className="space-y-2">
            {playlists === null ? (
              <div className="flex items-center gap-3 px-1 py-2">
                <motion.div
                  className="h-5 w-5 rounded-full border-2 border-[#00f0ff]/40 border-t-[#00f0ff]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/70">Cargando tus listas...</span>
              </div>
            ) : playlists.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/15 bg-black/25 px-4 py-8 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#00f0ff]/35 bg-[#111739]/90 text-[#7be3ff]">
                  <ListMusic className="h-5 w-5" />
                </span>
                <p className="text-sm font-bold text-white">Todavía no creaste ninguna lista.</p>
                <p className="text-xs font-semibold text-white/60">Poné tu nombre arriba y armá la primera.</p>
              </div>
            ) : (
              playlists.map((playlist) => (
                <Link
                  key={playlist.id}
                  href={playlist.status === "PUBLISHED" ? `/guess/${playlist.id}` : `/guess/${playlist.id}/edit`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-black/30 px-4 py-3 transition hover:border-[#00f0ff]/45 hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1129]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{playlist.title}</p>
                    <p className="text-xs font-semibold text-white/60">
                      {playlist.status === "PUBLISHED"
                        ? "Publicada · ver ranking"
                        : `Borrador · ${playlist.eligibleTrackCount}/${playlist.roundCount} canciones`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                      playlist.status === "PUBLISHED"
                        ? "bg-[#00ff9f]/15 text-[#7bffb0]"
                        : "bg-[#ffe600]/15 text-[#f8eeaf]"
                    }`}
                  >
                    {playlist.status === "PUBLISHED" ? "Publicada" : "Borrador"}
                  </span>
                </Link>
              ))
            )}
          </div>
        )}
      </section>
    </main>
  )
}
