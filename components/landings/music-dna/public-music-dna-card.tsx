import Image from "next/image"
import type { PublicProfileShare } from "@/lib/profile-share"

interface PublicMusicDnaCardProps {
  share: PublicProfileShare
  compact?: boolean
}

export function PublicMusicDnaCard({ share, compact = false }: PublicMusicDnaCardProps) {
  const visibleGenres = share.dominantGenres.length > 0 ? share.dominantGenres.slice(0, 3) : ["Perfil mixto"]

  return (
    <section
      className={`w-full overflow-hidden rounded-3xl border-2 border-[#00f0ff]/35 bg-[#0f1638]/92 text-[#eaf7ff] shadow-[0_24px_70px_rgba(0,0,0,0.48)] ${
        compact ? "p-4" : "p-4 sm:p-5"
      }`}
    >
      <div className="border-b-2 border-[#00f0ff]/25 pb-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7be3ff]">Pulso</p>
        <h1 className="mt-1 bg-linear-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-2xl font-black uppercase leading-none text-transparent sm:text-4xl">
          Perfil sonoro
        </h1>
      </div>

      <div className="mt-4 rounded-[22px] border-2 border-[#00f0ff]/25 bg-[#121a40]/85 p-3 sm:p-4">
        <div className="grid gap-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center">
          <div className="relative mx-auto flex w-full max-w-42 justify-center rounded-[18px] border border-[#ff43f8]/35 bg-[#0f1638] px-2 py-3 shadow-[0_0_24px_rgba(0,240,255,0.25)]">
            <Image
              src={`/images/characters/${share.personaAssetFile}`}
              alt={`${share.personaName} avatar`}
              width={190}
              height={220}
              className="h-auto w-full rounded-xl object-cover drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]"
              priority
            />
          </div>

          <div className="min-w-0">
            <div className="rounded-2xl border border-[#ff43f8]/35 bg-[#111739]/90 px-3 py-3 text-center shadow-[inset_0_0_0_1px_rgba(0,240,255,0.14)]">
              <p className="bg-linear-to-r from-[#ff43f8] via-[#ffe600] to-[#95ffc8] bg-clip-text font-sonic-persona text-[26px] font-black uppercase leading-none text-transparent sm:text-[34px]">
                {share.personaName}
              </p>
            </div>

            <p className="mt-3 rounded-xl border border-white/12 bg-black/20 px-3 py-3 text-sm font-semibold leading-relaxed text-[#d8ebff] sm:text-base">
              {share.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {visibleGenres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full bg-[#00f0ff]/16 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#d7faff] ring-1 ring-[#00f0ff]/35"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/16 bg-white/10 px-3 py-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7be3ff]">Batallas</p>
          <p className="mt-1 text-3xl font-black leading-none text-white">{share.completedBattlesCount}</p>
        </div>
        <div className="rounded-2xl border border-white/16 bg-white/10 px-3 py-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb5fb]">Votos analizados</p>
          <p className="mt-1 text-3xl font-black leading-none text-white">{share.generatedFromVotes}</p>
        </div>
      </div>
    </section>
  )
}
