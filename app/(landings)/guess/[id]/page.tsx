import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { GuessPlayScreen } from "@/components/landings/guess/guess-play-screen"
import { getPublicPlaylistInfo } from "@/lib/guess-store"

interface GuessPlayPageProps {
  params: Promise<{ id: string }>
}

// Deduplicates the playlist read between generateMetadata and the page render.
const getPlaylistInfo = cache(getPublicPlaylistInfo)

function getSiteOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://pulsoapp.ar"
}

export async function generateMetadata({ params }: GuessPlayPageProps): Promise<Metadata> {
  const { id } = await params
  const playlist = await getPlaylistInfo(id)
  if (!playlist) {
    return { title: "Lista no disponible | Pulso" }
  }

  const origin = getSiteOrigin()
  const title = `¿Cuánto conocés a ${playlist.title}? | Pulso`
  const description = `Jugá las ${playlist.roundCount} rondas y descubrí cuánto conocés el gusto musical de ${playlist.title}.`
  const imageUrl = new URL(`/api/guess/${id}/image`, origin).toString()

  return {
    title,
    description,
    alternates: {
      canonical: `/guess/${id}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `/guess/${id}`,
      siteName: "Pulso",
      locale: "es_AR",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function GuessPlayPage({ params }: GuessPlayPageProps) {
  const { id } = await params
  const playlist = await getPlaylistInfo(id)
  if (!playlist) {
    notFound()
  }

  const shareUrl = new URL(`/guess/${id}`, getSiteOrigin()).toString()

  return (
    <main className="relative mx-auto w-full max-w-7xl overflow-hidden px-4 pb-8 pt-24 text-[#eaf7ff] selection:bg-[#ff4ef5] selection:text-black">
      <div className="bg-scene-battle pointer-events-none fixed inset-0 z-0 opacity-90" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.14),transparent_45%),radial-gradient(circle_at_75%_15%,rgba(255,67,248,0.2),transparent_45%),linear-gradient(180deg,rgba(8,11,26,0.74),rgba(8,11,26,0.92))]" />

      <section className="relative z-10 mx-auto w-full max-w-300 overflow-hidden rounded-[28px] py-6">
        <GuessPlayScreen playlistId={id} playlistTitle={playlist.title} shareUrl={shareUrl} />
      </section>
    </main>
  )
}
