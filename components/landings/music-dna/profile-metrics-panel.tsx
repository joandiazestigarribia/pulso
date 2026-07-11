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
    <section className="rounded-[18px_32px_18px_28px] bg-[#12193f]/78 p-4 shadow-[0_12px_20px_rgba(0,0,0,0.3)]">
      <h2 className="bg-gradient-to-r from-[#00f0ff] to-[#ff43f8] bg-clip-text text-xl font-black uppercase tracking-tight text-transparent">
        Métricas clave
      </h2>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9bdfff]/85">Resumen de señales del perfil</p>

      <div className="mt-3 space-y-2.5">
        <div className="flex flex-col items-start gap-1 rounded-[14px] bg-[#0f1535]/85 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(0,240,255,0.14)] transition-colors hover:bg-[#131c46] sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#dff7ff]"><Flame className="h-4 w-4 text-[#ffe600]" />Intensidad sonora</span>
          <span className="text-xl font-black tabular-nums text-[#00f0ff]">{toPercent(intensityScore)}%</span>
        </div>
        <div className="flex flex-col items-start gap-1 rounded-[14px] bg-[#10173b]/85 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(255,67,248,0.14)] transition-colors hover:bg-[#151f4b] sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#dff7ff]"><Music2 className="h-4 w-4 text-[#ff43f8]" />Pulso rítmico</span>
          <span className="text-xl font-black tabular-nums text-[#ff9ffd]">{toPercent(rhythmScore)}%</span>
        </div>
        <div className="flex flex-col items-start gap-1 rounded-[14px] bg-[#10183d]/85 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(255,230,0,0.14)] transition-colors hover:bg-[#15204f] sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#dff7ff]"><Trophy className="h-4 w-4 text-[#ffe600]" />Tendencia al baile</span>
          <span className="text-xl font-black tabular-nums text-[#ffe98f]">{toPercent(danceScore)}%</span>
        </div>
        <div className="flex flex-col items-start gap-1 rounded-[14px] bg-[#11173c]/85 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(0,255,102,0.14)] transition-colors hover:bg-[#16214f] sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-[#dff7ff]"><ShieldAlert className="h-4 w-4 text-[#00ff66]" />Exploración de géneros</span>
          <span className="text-xl font-black tabular-nums text-[#89ffc3]">{toPercent(explorationScore)}%</span>
        </div>
      </div>
    </section>
  )
}
