import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PublicMusicDnaCard } from "@/components/landings/music-dna/public-music-dna-card"
import { buildProfileShareImageUrl, getPublicProfileShare } from "@/lib/profile-share"

interface PublicProfileSharePageProps {
  params: Promise<{
    token: string
  }>
}

function getSiteOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://pulsoapp.ar"
}

export async function generateMetadata({ params }: PublicProfileSharePageProps): Promise<Metadata> {
  const { token } = await params
  const share = await getPublicProfileShare(token)
  if (!share) {
    return {
      title: "Perfil sonoro no disponible | Pulso",
    }
  }

  const origin = getSiteOrigin()
  const title = `${share.personaName} | Perfil Sonoro Pulso`
  const description = `Mi Perfil Sonoro en Pulso es ${share.personaName}.`
  const imageUrl = buildProfileShareImageUrl(origin, token)

  return {
    title,
    description,
    alternates: {
      canonical: `/profile/share/${token}`,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/profile/share/${token}`,
      siteName: "Pulso",
      locale: "es_AR",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Perfil sonoro ${share.personaName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function PublicProfileSharePage({ params }: PublicProfileSharePageProps) {
  const { token } = await params
  const share = await getPublicProfileShare(token)
  if (!share) {
    notFound()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080b1a] px-4 pb-10 pt-20 text-[#eaf7ff]">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-90"
        style={{
          backgroundImage: "url('/images/music-dna/background-music-dna.png')",
          backgroundPosition: "center",
          backgroundSize: "auto",
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.14),transparent_45%),radial-gradient(circle_at_75%_15%,rgba(255,67,248,0.2),transparent_45%),linear-gradient(180deg,rgba(8,11,26,0.74),rgba(8,11,26,0.94))]" />

      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <PublicMusicDnaCard share={share} />

        <div className="mt-5 flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold text-[#d8ebff]">Descubri tu propio perfil votando canciones en versus.</p>
          <Link
            href="/battle?source=shared-profile"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#00f0ff]/45 bg-[#00f0ff]/18 px-5 py-2 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#00f0ff]/25"
          >
            Crear mi perfil
          </Link>
        </div>
      </div>
    </main>
  )
}
