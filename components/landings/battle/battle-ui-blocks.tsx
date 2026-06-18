import Link from "next/link"
import { RefreshCcw, Volume2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

interface BattleTopNoticesProps {
  voteError: string | null
  resetError: string | null
  authConfirmation: { movedBattles: number } | null
  onDismissAuthConfirmation: () => void
}

export function BattleTopNotices({
  voteError,
  resetError,
  authConfirmation,
  onDismissAuthConfirmation,
}: BattleTopNoticesProps) {
  return (
    <>
      {(voteError || resetError) && (
        <div className="relative z-20 mx-auto mt-3 w-[min(95%,520px)] rounded-xl border-2 border-[#ff6c7b]/45 bg-[#2a0e19]/80 px-4 py-2 text-sm font-semibold text-[#ffd6dd]">
          {voteError ?? resetError}
        </div>
      )}

      {authConfirmation && (
        <section className="relative z-20 mx-auto mt-3 w-[min(96%,760px)] rounded-2xl border border-[#00f0ff]/30 bg-[#111739]/74 px-4 py-3 text-[#eaf7ff] backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-[#d8ebff]">
              Progreso vinculado correctamente.{" "}
              {authConfirmation.movedBattles > 0
                ? `${authConfirmation.movedBattles} Los registros de batalla se conservaron después de iniciar sesión.`
                : "Tu progreso actual ya está asociado a tu cuenta."}
            </p>
            <button
              type="button"
              onClick={onDismissAuthConfirmation}
              className="rounded border border-white/35 px-2 py-1 text-xs font-black uppercase tracking-wide text-white hover:bg-white hover:text-black"
            >
              X
            </button>
          </div>
        </section>
      )}
    </>
  )
}

interface BattleProgressBannerProps {
  completedBattles: number
  goalVotes: number
}

export function BattleProgressBanner({ completedBattles, goalVotes }: BattleProgressBannerProps) {
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="mx-auto mb-3 flex w-[min(96%,820px)] flex-col gap-1.5 rounded-2xl border border-white/15 bg-black/45 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs font-black uppercase tracking-[0.12em] text-[#f8eeaf]">
            {completedBattles}/{goalVotes} canciones votadas
          </p>
          {completedBattles >= goalVotes ? (
            <p className="text-xs font-semibold text-white/85">
              Llegaste a la cantidad necesaria. Revisa tu perfil sonoro{" "}
              <Link href="/music-dna" className="font-black text-[#00ff9f] underline underline-offset-2 hover:text-[#7affc9]">
                aqui
              </Link>
              .
            </p>
          ) : (
            <p className="text-xs font-semibold text-white/80">Vota para desbloquear tu perfil sonoro.</p>
          )}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (completedBattles / goalVotes) * 100)}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  )
}

interface BattleNowPlayingFooterProps {
  activePreviewTrackName: string
  isResetting: boolean
  isSkipping: boolean
  skipsRemaining: number
  onRequestReset: () => void
  onSkipStage: () => void
}

export function BattleNowPlayingFooter({
  activePreviewTrackName,
  isResetting,
  isSkipping,
  skipsRemaining,
  onRequestReset,
  onSkipStage,
}: BattleNowPlayingFooterProps) {
  return (
    <motion.footer
      className="relative z-20 mx-auto mb-4 flex min-h-16 w-[min(92%,860px)] items-center justify-between gap-3 rounded-[22px] border border-white/20 bg-[#111739]/74 px-3 py-2 shadow-[0_0_28px_rgba(0,0,0,0.5)] backdrop-blur md:mb-6 md:px-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
    >
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex h-10 w-10 rotate-3 items-center justify-center rounded-xl border border-[#00f0ff]/45 bg-black/60 shadow-[0_0_18px_rgba(0,240,255,0.32)]">
          <Volume2 className="h-5 w-5 text-[#7be3ff]" />
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f8eeaf] md:text-xs">Reproduciendo ahora</div>
          <div className="text-xs font-semibold text-white md:text-sm">{activePreviewTrackName}</div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <motion.button
          type="button"
          onClick={onSkipStage}
          disabled={isSkipping}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-xl border border-white/30 bg-black/45 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSkipping ? "Salteando..." : `Saltear (${skipsRemaining})`}
        </motion.button>
        <motion.button
          type="button"
          onClick={onRequestReset}
          disabled={isResetting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 rounded-xl border border-[#ff806d]/45 bg-[#2f1419]/75 px-3 py-1.5 text-xs font-bold text-[#ffd2c9] transition-all hover:border-[#ff806d]/80 hover:bg-[#3a1820] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
          {isResetting ? "Reiniciando..." : "Reiniciar juego"}
        </motion.button>
      </div>
    </motion.footer>
  )
}

interface BattleSkipLimitModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BattleSkipLimitModal({ isOpen, onClose }: BattleSkipLimitModalProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.section
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-120 rounded-3xl border-[3px] border-[#ff43f8]/35 bg-[#0f1638]/92 p-4 text-[#eaf7ff] shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
            initial={{ y: 10, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
          >
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#ffb5fb]">Limite de saltos</p>
            <h3 className="mt-1 bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-l font-black uppercase leading-none text-transparent">
              Solo puedes saltear 5 canciones seguidas
            </h3>
            <p className="mt-3 text-sm font-semibold text-[#d8ebff]">
              Para seguir avanzando, necesitas votar una cancion en este duelo.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#7be3ff]/35 bg-[#0d1636]/72 px-3 py-2 text-xs font-black uppercase tracking-wide text-[#d8ebff] transition-colors hover:border-[#00f0ff]/55 hover:text-[#eaf7ff]"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  )
}

interface BattleResetConfirmModalProps {
  isOpen: boolean
  isResetting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function BattleResetConfirmModal({
  isOpen,
  isResetting,
  onCancel,
  onConfirm,
}: BattleResetConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.section
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-120 rounded-3xl border-[3px] border-[#ff806d]/35 bg-[#0f1638]/92 p-4 text-[#eaf7ff] shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
            initial={{ y: 10, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
          >
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#ffd2c9]">Reinicio de juego</p>
            <h3 className="mt-1 bg-gradient-to-r from-[#ff806d] via-[#ff43f8] to-[#ffe600] bg-clip-text text-l font-black uppercase leading-none text-transparent">
              Esto borrara tu progreso actual
            </h3>
            <p className="mt-3 text-sm font-semibold text-[#d8ebff]">
              Se reiniciaran tus canciones votadas y el progreso de perfil sonoro para tu sesion actual.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isResetting}
                className="rounded-lg border border-[#7be3ff]/35 bg-[#0d1636]/72 px-3 py-2 text-xs font-black uppercase tracking-wide text-[#d8ebff] transition-colors hover:border-[#00f0ff]/55 hover:text-[#eaf7ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Seguir jugando
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isResetting}
                className="rounded-lg border border-[#ff806d]/45 bg-[#2f1419]/75 px-3 py-2 text-xs font-black uppercase tracking-wide text-[#ffd2c9] transition-all hover:border-[#ff806d]/80 hover:bg-[#3a1820] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResetting ? "Reiniciando..." : "Confirmar"}
              </button>
            </div>
          </motion.div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  )
}
