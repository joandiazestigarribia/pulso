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
    <section className="rounded-[18px_32px_18px_28px] bg-[#f0d7b4] p-3 shadow-[0_10px_16px_rgba(125,79,43,0.16)] ring-1 ring-[#7d4f2b]/30">
      <h2 className="text-2xl font-black uppercase tracking-tight">Metricas de Perfil</h2>
      <div className="mt-3 space-y-3">
        <div className="flex items-center justify-between gap-2 rounded-[14px] bg-[#f8e9d1] px-3 py-2 shadow-[inset_0_0_0_1px_rgba(192,150,112,0.55)]">
          <span className="inline-flex items-center gap-2 text-sm font-bold"><Flame className="h-4 w-4" />Intensidad Sonora</span>
          <span className="text-2xl font-black">{toPercent(intensityScore)}%</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-[14px] bg-[#f8e9d1] px-3 py-2 shadow-[inset_0_0_0_1px_rgba(192,150,112,0.55)]">
          <span className="inline-flex items-center gap-2 text-sm font-bold"><Music2 className="h-4 w-4" />Pulso Ritmico</span>
          <span className="text-2xl font-black">{toPercent(rhythmScore)}%</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-[14px] bg-[#f8e9d1] px-3 py-2 shadow-[inset_0_0_0_1px_rgba(192,150,112,0.55)]">
          <span className="inline-flex items-center gap-2 text-sm font-bold"><Trophy className="h-4 w-4" />Ganas de Baile</span>
          <span className="text-2xl font-black">{toPercent(danceScore)}%</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-[14px] bg-[#f8e9d1] px-3 py-2 shadow-[inset_0_0_0_1px_rgba(192,150,112,0.55)]">
          <span className="inline-flex items-center gap-2 text-sm font-bold"><ShieldAlert className="h-4 w-4" />Exploracion de Generos</span>
          <span className="text-2xl font-black">{toPercent(explorationScore)}%</span>
        </div>
      </div>
    </section>
  )
}
