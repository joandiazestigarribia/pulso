import { Flame, Music2, ShieldAlert, Trophy } from "lucide-react"
import { toPercent } from "@/lib/music-dna"

interface ProfileMetricsPanelProps {
  intensityScore: number
  rhythmScore: number
  danceScore: number
  explorationScore: number
}

export function ProfileMetricsPanel({
  intensityScore,
  rhythmScore,
  danceScore,
  explorationScore,
}: ProfileMetricsPanelProps) {
  return (
    <section className="rounded-[18px_32px_18px_28px] bg-[#f0d7b4] p-4 shadow-[0_10px_16px_rgba(125,79,43,0.16)] ring-1 ring-[#7d4f2b]/30">
      <h2 className="text-xl font-black uppercase tracking-tight">Metricas Clave</h2>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6a432a]/75">Resumen de senales del perfil</p>

      <div className="mt-3 space-y-2.5">
        <div className="flex items-center justify-between gap-3 rounded-[14px] bg-[#f8e9d1]/95 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(192,150,112,0.45)] transition-colors hover:bg-[#faedd8]">
          <span className="inline-flex items-center gap-2 text-sm font-bold"><Flame className="h-4 w-4" />Intensidad sonora</span>
          <span className="text-xl font-black tabular-nums">{toPercent(intensityScore)}%</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-[14px] bg-[#f8e9d1]/95 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(192,150,112,0.45)] transition-colors hover:bg-[#faedd8]">
          <span className="inline-flex items-center gap-2 text-sm font-bold"><Music2 className="h-4 w-4" />Pulso ritmico</span>
          <span className="text-xl font-black tabular-nums">{toPercent(rhythmScore)}%</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-[14px] bg-[#f8e9d1]/95 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(192,150,112,0.45)] transition-colors hover:bg-[#faedd8]">
          <span className="inline-flex items-center gap-2 text-sm font-bold"><Trophy className="h-4 w-4" />Respuesta al baile</span>
          <span className="text-xl font-black tabular-nums">{toPercent(danceScore)}%</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-[14px] bg-[#f8e9d1]/95 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(192,150,112,0.45)] transition-colors hover:bg-[#faedd8]">
          <span className="inline-flex items-center gap-2 text-sm font-bold"><ShieldAlert className="h-4 w-4" />Exploracion de generos</span>
          <span className="text-xl font-black tabular-nums">{toPercent(explorationScore)}%</span>
        </div>
      </div>
    </section>
  )
}
