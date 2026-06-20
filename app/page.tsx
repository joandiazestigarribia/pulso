import Image from "next/image"
import Link from "next/link"
import { Lock, Music2, Play, Sparkles, Swords } from "lucide-react"
import { CampgroundHeader } from "@/components/auth/campground-header"
import { MUSIC_DNA_UNLOCK_THRESHOLD } from "@/lib/music-dna-config"

const homeBackgroundStyle = {
  backgroundImage: "url('/images/home/background-home.jpg')",
  backgroundPosition: "center",
  backgroundSize: "contain",
} as const

const productLoop = [
  {
    label: "01",
    title: "Juga versus",
    description: "Entras como invitado, escuchas dos previews y votas la cancion que mas te mueve.",
  },
  {
    label: "02",
    title: "Completa el umbral",
    description: `Cada versus suma progreso hasta llegar a ${MUSIC_DNA_UNLOCK_THRESHOLD} batallas votadas.`,
  },
  {
    label: "03",
    title: "Abre tu Perfil Sonoro",
    description: "Pulso transforma tus decisiones en una lectura visual de energia, mood, ritmo y generos dominantes.",
  },
]

const profileSignals = [
  {
    label: "Energia",
    width: "w-3/5",
  },
  {
    label: "Mood",
    width: "w-2/5",
  },
  {
    label: "Ritmo",
    width: "w-1/2",
  },
]

const battleDemoTracks = [
  {
    label: "Cancion A",
    title: "Midnight City",
    artist: "M83",
    image: "/images/album-midnight-city.jpg",
    tone: "cyan",
  },
  {
    label: "Cancion B",
    title: "Blinding Lights",
    artist: "The Weeknd",
    image: "/images/album-blinding-lights.jpg",
    tone: "pink",
  },
]

const avatarPreview = [
  {
    name: "Nomada Neon",
    image: "/images/characters/neon_nomad_character_asset resize.png",
    imageClassName: "scale-100",
  },
  {
    name: "Capitan Synth",
    image: "/images/characters/synth_captain_character_asset resize.png",
    imageClassName: "scale-100",
  },
  {
    name: "Explorador Ranger",
    image: "/images/characters/ranger_character_asset resize.png",
    imageClassName: "scale-100",
  },
]

const avatarOverflow = [
  {
    name: "Lo-Fi Alchemist",
    image: "/images/characters/lo_fi_alchemist_character_asset resize.png",
  },
  {
    name: "Vaporwave Druid",
    image: "/images/characters/vaporwave_druid_character_asset resize.png",
  },
  {
    name: "Retro Scout",
    image: "/images/characters/retro_scout_character_asset resize.png",
  },
  {
    name: "Piloto Hyperpop",
    image: "/images/characters/hyperpop_pilot_character_asset resize.png",
  },
]

function BattleDemoCard({ track }: { track: (typeof battleDemoTracks)[number] }) {
  return (
    <div className="group relative">
      <div
        className={`absolute -top-3 z-10 rounded-xl border border-white/35 bg-black/65 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide backdrop-blur ${track.tone === "cyan" ? "-left-2 -rotate-6 text-[#7be3ff]" : "-right-2 rotate-6 text-[#ffb5fb]"}`}
      >
        {track.label}
      </div>
      <div
        className={`rounded-[18px] border bg-black/45 p-2 shadow-[0_0_18px_rgba(0,0,0,0.45)] backdrop-blur-sm ${track.tone === "cyan" ? "border-[#7be3ff]/75" : "border-[#ffb5fb]/75"}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] border border-white/25">
          <Image
            src={track.image}
            alt={`${track.title} cover`}
            fill
            sizes="180px"
            className="object-cover grayscale transition-transform duration-300 group-hover:scale-105 group-hover:grayscale-0"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
        </div>
        <h3 className="mt-1.5 truncate bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-[10px] font-black uppercase leading-none text-transparent">
          {track.title}
        </h3>
        <p className="mt-0.5 truncate text-[10px] font-semibold text-[#d8e9ff]">{track.artist}</p>
        <div className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/35 p-1">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/25 bg-black/45">
            <Play className="h-3 w-3 text-white" />
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600]" />
          </div>
        </div>
        <div
          className={`mt-1.5 rounded-lg py-1.5 text-center text-[10px] font-black uppercase tracking-[0.14em] text-black ${track.tone === "cyan" ? "bg-[#7be3ff]" : "bg-[#ffb5fb]"}`}
        >
          Votar
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080b1a] text-[#eaf7ff] selection:bg-[#ff43f8] selection:text-black">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-90" style={homeBackgroundStyle} />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.14),transparent_45%),radial-gradient(circle_at_75%_15%,rgba(255,67,248,0.2),transparent_45%),linear-gradient(180deg,rgba(8,11,26,0.72),rgba(8,11,26,0.94))]" />
      <CampgroundHeader />

      <section className="relative z-10 mx-auto grid w-full max-w-300 content-center gap-8 px-4 pb-6 pt-22 md:px-6 md:pt-24 lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00f0ff]/35 bg-[#090d25]/55 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#7be3ff] backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#ffe600]" />
            Versus primero, Perfil Sonoro despues
          </div>

          <h1 className="mt-5 max-w-3xl bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-5xl font-black uppercase leading-[0.92] tracking-tight text-transparent md:text-6xl xl:text-7xl">
            Descubri tu pulso musical
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-[#d8e9ff] md:text-lg">
            Enfrenta canciones en versus 1v1, vota sin friccion y deja que tus elecciones construyan tu Perfil Sonoro.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/battle"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#00f0ff]/45 bg-[#00f0ff]/15 px-5 py-3 text-sm font-black uppercase tracking-wide text-[#dffbff] shadow-[0_0_24px_rgba(0,240,255,0.2)] transition-all hover:border-[#00f0ff]/80 hover:bg-[#00f0ff]/25"
            >
              Jugar versus
              <Swords className="h-4 w-4" />
            </Link>
            <Link
              href="/music-dna"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ff43f8]/45 bg-[#ff43f8]/15 px-5 py-3 text-sm font-black uppercase tracking-wide text-[#ffd6fb] shadow-[0_0_24px_rgba(255,67,248,0.18)] transition-all hover:border-[#ffb5fb]/75 hover:bg-[#ff43f8]/25 hover:text-white"
            >
              Ver Perfil Sonoro
              <Music2 className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <aside className="lg:self-center">
          <div className="rounded-[28px] bg-[#090d25]/38 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.24),0_0_28px_rgba(0,240,255,0.1)] backdrop-blur-sm">

            <div className="mt-3 grid grid-cols-[1fr_44px_1fr] items-center gap-2">
              <BattleDemoCard track={battleDemoTracks[0]} />
              <div className="flex h-11 w-11 rotate-6 items-center justify-center rounded-2xl border border-[#ffe600]/60 bg-black/65 text-lg font-black text-[#ffe600] shadow-[0_0_22px_rgba(255,230,0,0.28)]">
                VS
              </div>
              <BattleDemoCard track={battleDemoTracks[1]} />
            </div>
          </div>
        </aside>
      </section>

      <section className="relative z-10 mx-auto grid w-full max-w-300 gap-5 px-4 pb-8 md:px-6 lg:grid-cols-2">
          <div className="flex min-h-[340px] flex-col rounded-[28px] bg-[#180b2c]/42 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.24),0_0_30px_rgba(255,67,248,0.12)] backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb5fb]">Perfil Sonoro</p>
                <h2 className="mt-1 text-2xl font-black uppercase leading-none text-white">En progreso</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/45 shadow-[inset_0_0_0_1px_rgba(255,230,0,0.42)]">
                <Lock className="h-5 w-5 text-[#ffe600]" />
              </div>
            </div>

            <div className="mt-3 rounded-2xl bg-black/30 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#c7dbf2]">
                  Progreso de desbloqueo
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ffe600]">
                  0/{MUSIC_DNA_UNLOCK_THRESHOLD}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full w-1/12 rounded-full bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600]" />
              </div>
            </div>

            <div className="mt-4 grid flex-1 items-center gap-4 md:grid-cols-[1fr_150px]">
              <div className="space-y-4">
              {profileSignals.map((signal) => (
                <div key={signal.label} className="group">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb5fb]">
                      {signal.label}
                    </span>
                    <Lock className="h-3.5 w-3.5 text-[#ffe600]" />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className={`${signal.width} h-full rounded-full bg-gradient-to-r from-[#00f0ff]/70 via-[#ff43f8]/70 to-[#ffe600]/70 opacity-45 blur-[0.2px]`} />
                  </div>
                </div>
              ))}
              </div>

              <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00f0ff]/10 via-[#ff43f8]/12 to-[#ffe600]/10 blur-md" />
                <div className="absolute h-30 w-30 rounded-full border border-[#00f0ff]/18" />
                <div className="absolute h-22 w-22 rounded-full border border-[#ff43f8]/20" />
                <div className="absolute h-14 w-14 rounded-full border border-[#ffe600]/25" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-black/45 shadow-[inset_0_0_0_1px_rgba(255,230,0,0.35),0_0_24px_rgba(255,230,0,0.12)]">
                  <Lock className="h-5 w-5 text-[#ffe600]" />
                </div>
              </div>
            </div>

            <p className="pt-4 text-sm font-bold leading-relaxed text-[#d8e9ff]">
              Tus votos activan la lectura y revelan tu identidad sonora completa.
            </p>
          </div>

        <div className="relative flex min-h-[340px] flex-col overflow-hidden rounded-[28px] bg-[#090d25]/30 p-4 shadow-[0_10px_24px_rgba(0,0,0,0.2),0_0_34px_rgba(0,240,255,0.1)] backdrop-blur-sm">
          <div className="pointer-events-none absolute inset-x-4 bottom-5 h-24 rounded-full bg-gradient-to-r from-[#00f0ff]/10 via-[#ff43f8]/10 to-[#ffe600]/10 blur-2xl" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7be3ff]">Avatares</p>
              <h2 className="mt-1 text-2xl font-black uppercase leading-none text-white">Tu identidad visual</h2>
            </div>
            <Sparkles className="h-5 w-5 text-[#ffe600]" />
          </div>

          <div className="relative mt-4 grid flex-1 grid-cols-3 items-end gap-3">
            {avatarPreview.map((avatar) => (
              <div key={avatar.name} className="text-center">
                <div className="relative mx-auto h-44 w-36">
                  <div className="absolute inset-x-5 bottom-2 h-10 rounded-full bg-black/35 blur-lg" />
                  <Image
                    src={avatar.image}
                    alt={`${avatar.name} avatar`}
                    fill
                    sizes="180px"
                    className={`${avatar.imageClassName} object-contain drop-shadow-[0_14px_16px_rgba(0,0,0,0.48)]`}
                  />
                </div>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#c7dbf2]">{avatar.name}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-4 flex items-center justify-between gap-3 rounded-2xl bg-black/18 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-2">
              {avatarOverflow.map((avatar) => (
                <div key={avatar.name} className="relative h-11 w-11">
                  <Image
                    src={avatar.image}
                    alt={`${avatar.name} avatar`}
                    fill
                    sizes="48px"
                    className="object-contain opacity-85 drop-shadow-[0_8px_10px_rgba(0,0,0,0.4)]"
                  />
                </div>
              ))}
            </div>
            <p className="text-right text-[10px] font-black uppercase tracking-[0.13em] text-[#7be3ff]">
              + de 15 perfiles sonoros
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-300 px-4 pb-10 md:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f8eeaf]">Como funciona</p>
          <div className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {productLoop.map((step) => (
            <article
              key={step.label}
              className="rounded-2xl bg-[#090d25]/28 p-4 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffe600]">{step.label}</p>
              <h3 className="mt-2 text-lg font-black uppercase leading-tight text-white">{step.title}</h3>
              <p className="mt-2 text-sm font-semibold text-[#c7dbf2]">{step.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
