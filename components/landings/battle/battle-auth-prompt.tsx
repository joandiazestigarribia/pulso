import Link from "next/link"

interface BattleAuthPromptProps {
  hasReachedUnlockThreshold: boolean
  copyVariant: "unlock_dna" | "save_progress"
}

export function BattleAuthPrompt({ hasReachedUnlockThreshold, copyVariant }: BattleAuthPromptProps) {
  return (
    <section className="relative z-20 mx-auto mt-3 w-[min(96%,760px)] rounded-2xl border border-[#ff43f8]/30 bg-[#111739]/78 px-4 py-3 text-[#eaf7ff] shadow-[inset_0_0_0_1px_rgba(0,240,255,0.12)] backdrop-blur">
      <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
        <div>
          <div className="bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-[11px] font-black uppercase tracking-[0.15em] text-transparent">
            {hasReachedUnlockThreshold ? "¡Perfil Sonoro listo!" : "Guardá tu progreso"}
          </div>
          <p className="text-sm text-[#d8ebff]">
            {copyVariant === "unlock_dna"
              ? "Iniciá sesión para desbloquear tu Perfil Sonoro y obtener recomendaciones personalizadas basadas en tus votos."
              : "Seguí jugando como invitado y, cuando quieras, iniciá sesión para guardar tu progreso en todos tus dispositivos."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/music-dna"
            className="h-fit min-w-25 rounded-lg border border-[#7be3ff]/35 bg-[#0d1636]/72 p-2 text-center text-[8px] font-black uppercase tracking-wide text-[#d8ebff] transition-colors hover:border-[#00f0ff]/55 hover:text-[#eaf7ff]"
          >
            Ver Perfil
          </Link>
          <Link
            href="/login?next=%2Fbattle"
            className="h-fit min-w-25 rounded-lg border bg-gradient-to-r from-[#00ff66] to-[#00f0ff] p-2 text-center text-[8px] font-black uppercase tracking-wide text-black transition-all hover:brightness-110"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </section>
  )
}
