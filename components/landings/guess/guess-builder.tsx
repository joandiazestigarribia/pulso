"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Search, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import type { Track } from "@/lib/mock-data"
import { GUESS_MAX_PLAYLIST_TRACKS, GUESS_ROUND_COUNT } from "@/lib/guess-config"
import { GuessPublishConfirmModal } from "@/components/landings/guess/guess-ui-blocks"

interface PlaylistTrackSummary {
  id: string
  position: number
  track: Track
}

interface PlaylistDetail {
  id: string
  title: string
  status: "DRAFT" | "PUBLISHED"
  roundCount: number
  trackCount: number
  eligibleTrackCount: number
  tracks: PlaylistTrackSummary[]
}

interface RoundPreviewPair {
  correctTrack: Track
  decoyTrack: Track
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ status: number; body: T | null }> {
  const response = await fetch(url, init)
  const body = (await response.json().catch(() => null)) as T | null
  return { status: response.status, body }
}

interface GuessBuilderProps {
  playlistId: string
}

export function GuessBuilder({ playlistId }: GuessBuilderProps) {
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Track[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [pendingTrackId, setPendingTrackId] = useState<string | null>(null)
  const [addTrackError, setAddTrackError] = useState<string | null>(null)
  const [removeTrackError, setRemoveTrackError] = useState<string | null>(null)
  const [loadedImageIds, setLoadedImageIds] = useState<Set<string>>(new Set())
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [previewPairs, setPreviewPairs] = useState<RoundPreviewPair[] | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    void (async () => {
      const { status, body } = await fetchJson<PlaylistDetail>(`/api/guess/${playlistId}`)
      if (status === 401 || status === 403) {
        setLoadError("No tenés acceso a esta lista.")
        return
      }
      if (!body || status >= 400) {
        setLoadError("No pudimos cargar la lista.")
        return
      }

      setPlaylist(body)
    })()
  }, [playlistId])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setSearchError(null)
      setIsSearching(false)
      return
    }

    const controller = new AbortController()
    setIsSearching(true)
    setSearchError(null)

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/guess/tracks/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        const body = (await response.json().catch(() => null)) as Track[] | null

        if (!response.ok || !body) {
          setResults([])
          setSearchError("No pudimos buscar canciones. Probá de nuevo.")
          return
        }

        setResults(body)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        setResults([])
        setSearchError("Error de red al buscar canciones.")
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false)
        }
      }
    }, 350)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query])

  const markImageLoaded = (id: string) => {
    setLoadedImageIds((prev) => {
      if (prev.has(id)) {
        return prev
      }
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const isAtTrackLimit = (playlist?.tracks.length ?? 0) >= GUESS_MAX_PLAYLIST_TRACKS

  const handleAddTrack = async (track: Track) => {
    if (pendingTrackId || isAtTrackLimit) {
      return
    }

    setPendingTrackId(track.id)
    setAddTrackError(null)
    try {
      const { status, body } = await fetchJson<PlaylistDetail>(`/api/guess/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id }),
      })

      if (body && status < 400) {
        setPlaylist(body)
        return
      }

      setAddTrackError(
        status === 422
          ? `Llegaste al máximo de ${GUESS_MAX_PLAYLIST_TRACKS} canciones.`
          : "No pudimos agregar la canción. Probá de nuevo."
      )
    } catch {
      setAddTrackError("Error de red al agregar la canción.")
    } finally {
      setPendingTrackId(null)
    }
  }

  const handleRemoveTrack = async (trackId: string) => {
    if (pendingTrackId) {
      return
    }

    setPendingTrackId(trackId)
    setRemoveTrackError(null)
    try {
      const { status, body } = await fetchJson<PlaylistDetail>(`/api/guess/${playlistId}/tracks/${trackId}`, {
        method: "DELETE",
      })

      if (!body || status >= 400) {
        setRemoveTrackError("No pudimos sacar la canción. Probá de nuevo.")
        return
      }

      setPlaylist(body)
    } catch {
      setRemoveTrackError("Error de red al sacar la canción.")
    } finally {
      setPendingTrackId(null)
    }
  }

  const handleOpenConfirm = async () => {
    setIsConfirmOpen(true)
    setPreviewPairs(null)
    setPreviewError(null)

    const { status, body } = await fetchJson<RoundPreviewPair[]>(`/api/guess/${playlistId}/publish`)
    if (status >= 400 || !body) {
      setPreviewError("No pudimos generar la vista previa, pero igual podés publicar.")
      return
    }

    setPreviewPairs(body)
  }

  const handleCancelConfirm = () => {
    if (isPublishing) {
      return
    }
    setIsConfirmOpen(false)
  }

  const handleConfirmPublish = async () => {
    if (isPublishing) {
      return
    }

    setIsPublishing(true)
    setPublishError(null)

    try {
      const { status, body } = await fetchJson<PlaylistDetail>(`/api/guess/${playlistId}/publish`, {
        method: "POST",
      })

      if (status >= 400 || !body) {
        setPublishError(
          status === 422
            ? `Necesitás ${playlist?.roundCount ?? GUESS_ROUND_COUNT} canciones con preview de audio para publicar.`
            : "No pudimos publicar la lista. Probá de nuevo."
        )
        setIsConfirmOpen(false)
        return
      }

      setPlaylist(body)
      setIsConfirmOpen(false)
    } finally {
      setIsPublishing(false)
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-130 rounded-2xl border-2 border-[#ff4ef5]/45 bg-[#2a0e19]/80 px-5 py-3 text-center text-sm font-bold text-[#ffd6dd]">
        {loadError}
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <motion.div
          className="h-9 w-9 rounded-full border-2 border-[#00f0ff]/40 border-t-[#00f0ff]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/80">Cargando lista...</span>
      </div>
    )
  }

  if (playlist.status === "PUBLISHED") {
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/guess/${playlist.id}` : `/guess/${playlist.id}`

    return (
      <div className="mx-auto w-full max-w-140 rounded-3xl border-2 border-[#00f0ff]/40 bg-[#0f1638]/92 p-6 text-center text-[#eaf7ff]">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7be3ff]">¡Lista publicada!</p>
        <h2 className="mt-1 bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-2xl font-black uppercase text-transparent">
          {playlist.title}
        </h2>
        <p className="mt-3 text-sm font-semibold text-[#d8ebff]">
          Ya no se puede editar (así el ranking es justo para todos). Compartí el link para que tus amigos jueguen.
        </p>
        <Link
          href={`/guess/${playlist.id}`}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border-2 border-[#1a1a1a] bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_10px_24px_rgba(0,0,0,0.5)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1638]"
        >
          Ver mi lista y ranking
        </Link>
        <p className="mt-3 truncate rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs font-mono text-white/70">
          {shareUrl}
        </p>
      </div>
    )
  }

  const progress = Math.min(playlist.eligibleTrackCount, playlist.roundCount)
  const playlistTrackIds = new Set(playlist.tracks.map((playlistTrack) => playlistTrack.track.id))

  return (
    <div className="mx-auto w-full max-w-190 space-y-5">
      <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3">
        <h2 className="bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-xl font-black uppercase text-transparent">
          {playlist.title}
        </h2>
        <p className="mt-1 font-mono text-xs font-black uppercase tracking-[0.12em] text-[#f8eeaf]">
          {progress}/{playlist.roundCount} canciones listas
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] transition-all duration-300"
            style={{ width: `${Math.min(100, (progress / playlist.roundCount) * 100)}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/15 bg-black/35 p-4">
        <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/40 px-3 transition-colors focus-within:border-[#00f0ff]/60">
          <Search className="h-4 w-4 shrink-0 text-white/50" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscá una canción o artista..."
            aria-label="Buscar canción o artista"
            className="h-11 w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/40"
          />
        </div>

        {isSearching ? <p className="mt-3 text-xs font-semibold text-white/60">Buscando...</p> : null}
        {searchError ? <p className="mt-3 text-xs font-semibold text-[#ffb5c4]">{searchError}</p> : null}
        {!isSearching && !searchError && query.trim().length >= 2 && results.length === 0 ? (
          <p className="mt-3 text-xs font-semibold text-white/60">
            No encontramos canciones con preview para esa búsqueda.
          </p>
        ) : null}
        {addTrackError ? <p className="mt-3 text-xs font-semibold text-[#ffb5c4]">{addTrackError}</p> : null}

        {results.length > 0 ? (
          <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {results.map((track) => {
              const alreadyAdded = playlistTrackIds.has(track.id)
              const isLoaded = loadedImageIds.has(track.id)

              return (
                <li
                  key={track.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-white/5">
                    <Image
                      src={track.albumImage}
                      alt=""
                      fill
                      sizes="40px"
                      onLoad={() => markImageLoaded(track.id)}
                      className={`object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{track.name}</p>
                    <p className="truncate text-xs font-semibold text-white/60">{track.artist}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTrack(track)}
                    disabled={alreadyAdded || pendingTrackId === track.id || isAtTrackLimit}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[#00f0ff]/40 bg-[#00f0ff]/15 px-2.5 text-xs font-black uppercase text-[#d8ebff] transition hover:bg-[#00f0ff]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {alreadyAdded ? "Agregada" : "Agregar"}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/15 bg-black/35 p-4">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-[#7be3ff]">
          Tu lista ({playlist.tracks.length}/{GUESS_MAX_PLAYLIST_TRACKS})
        </p>
        <p className="mb-3 text-xs font-semibold text-white/55">
          Elegí las que más te representan, no hace falta agregar todo lo que encuentres.
        </p>

        {playlist.tracks.length === 0 ? (
          <p className="rounded-xl border border-white/12 bg-black/20 px-4 py-6 text-center text-sm font-semibold text-white/60">
            Todavía no agregaste canciones. Buscá arriba para empezar.
          </p>
        ) : (
          <ul className="space-y-2">
            {playlist.tracks.map((playlistTrack) => {
              const isLoaded = loadedImageIds.has(playlistTrack.track.id)

              return (
                <li
                  key={playlistTrack.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/15 bg-white/5">
                    <Image
                      src={playlistTrack.track.albumImage}
                      alt=""
                      fill
                      sizes="40px"
                      onLoad={() => markImageLoaded(playlistTrack.track.id)}
                      className={`object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{playlistTrack.track.name}</p>
                    <p className="truncate text-xs font-semibold text-white/60">
                      {playlistTrack.track.artist}
                      {!playlistTrack.track.previewUrl ? " · sin preview" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTrack(playlistTrack.track.id)}
                    disabled={pendingTrackId === playlistTrack.track.id}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#ff806d]/40 bg-[#2f1419]/60 text-[#ffd2c9] transition hover:bg-[#3a1820] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff806d] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Sacar canción"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {removeTrackError ? <p className="mt-3 text-xs font-semibold text-[#ffb5c4]">{removeTrackError}</p> : null}
      </div>

      {publishError ? (
        <p className="rounded-xl border border-[#ff6c7b]/45 bg-[#2a0e19]/80 px-4 py-2 text-sm font-semibold text-[#ffd6dd]">
          {publishError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleOpenConfirm}
        disabled={isPublishing || progress < playlist.roundCount}
        className="flex h-12 w-full items-center justify-center rounded-xl border-2 border-[#1a1a1a] bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] text-sm font-black uppercase tracking-[0.18em] text-black shadow-[0_10px_24px_rgba(0,0,0,0.5)] transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        Publicar y generar el juego
      </button>

      <GuessPublishConfirmModal
        isOpen={isConfirmOpen}
        isPublishing={isPublishing}
        previewPairs={previewPairs}
        previewError={previewError}
        onCancel={handleCancelConfirm}
        onConfirm={handleConfirmPublish}
      />
    </div>
  )
}
