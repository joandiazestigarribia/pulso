import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Copy,
  Facebook,
  Instagram,
  MessageCircle,
  Send,
  Share2,
  Twitter,
  X as XIcon,
  type LucideIcon,
} from "lucide-react"

type ShareNetwork = "x" | "whatsapp" | "telegram" | "facebook" | "instagram"
const DESCRIPTION_PREVIEW_MAX_CHARS = 160

interface SocialShareAction {
  network: ShareNetwork
  label: string
  Icon: LucideIcon
}

const SOCIAL_SHARE_ACTIONS: SocialShareAction[] = [
  { network: "x", label: "X", Icon: Twitter },
  { network: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
  { network: "telegram", label: "Telegram", Icon: Send },
  { network: "facebook", label: "Facebook", Icon: Facebook },
  { network: "instagram", label: "Instagram", Icon: Instagram },
]

interface MusicDnaShareModalProps {
  isOpen: boolean
  onClose: () => void
  personaName: string
  personaAssetFile: string
  description: string
  feedback: string | null
  isShareLinkLoading: boolean
  onNativeShare: () => void
  onCopyShare: () => void
  onShareToNetwork: (network: ShareNetwork) => void | Promise<void>
}

export function MusicDnaShareModal({
  isOpen,
  onClose,
  personaName,
  personaAssetFile,
  description,
  feedback,
  isShareLinkLoading,
  onNativeShare,
  onCopyShare,
  onShareToNetwork,
}: MusicDnaShareModalProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    setIsDescriptionExpanded(false)
  }, [description, isOpen])

  const isDescriptionTruncatable = description.length > DESCRIPTION_PREVIEW_MAX_CHARS
  const visibleDescription = useMemo(() => {
    if (!isDescriptionTruncatable || isDescriptionExpanded) {
      return description
    }

    return `${description.slice(0, DESCRIPTION_PREVIEW_MAX_CHARS).trimEnd()}...`
  }, [description, isDescriptionExpanded, isDescriptionTruncatable])

  if (!isOpen) {
    return null
  }

  return (
    <motion.section
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      onClick={onClose}
    >
      <motion.div
        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-140 flex-col overflow-hidden rounded-3xl border-2 border-[#00f0ff]/40 bg-[#0f1638]/94 p-3 text-[#eaf7ff] shadow-[0_18px_54px_rgba(0,0,0,0.5)] sm:max-h-[calc(100vh-2rem)] sm:p-4"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#00f0ff]/25 pb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7be3ff]">
              Tu card publica esta lista
            </p>
            <h3 className="mt-1 bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-xl font-black uppercase leading-none text-transparent sm:text-2xl">
              Comparti tu perfil sonoro
            </h3>
          </div>
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/30 text-white transition hover:bg-white/15"
            aria-label="Cerrar modal"
          >
            <XIcon className="h-5 w-5" />
          </motion.button>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-[#00f0ff]/28 bg-[#121a40]/78 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            <motion.div
              className="relative mx-auto flex w-full max-w-40 justify-center rounded-3xl border border-[#ff43f8]/35 bg-[#0f1638] px-2 py-3 shadow-[0_0_28px_rgba(0,240,255,0.24)] sm:max-w-45"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <Image
                src={`/images/characters/${personaAssetFile}`}
                alt={`${personaName} avatar`}
                width={190}
                height={220}
                className="h-auto w-full rounded-2xl object-cover drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]"
                priority
              />
            </motion.div>

            <div className="min-w-0 flex-1">
              <div className="w-full rounded-2xl border border-[#ff43f8]/35 bg-[#111739]/90 px-3 py-3 text-center shadow-[inset_0_0_0_1px_rgba(0,240,255,0.14)]">
                <p className="bg-gradient-to-r from-[#ff43f8] via-[#ffe600] to-[#95ffc8] bg-clip-text font-sonic-persona text-[24px] font-black uppercase leading-none text-transparent sm:text-[28px]">
                  {personaName}
                </p>
              </div>
              <div
                className={`mt-3 rounded-2xl border border-white/12 bg-black/18 px-3 py-3 ${
                  isDescriptionExpanded ? "max-h-40 overflow-y-auto expanded" : ""
                }`}
              >
                <p className="text-sm font-semibold leading-relaxed text-[#d8ebff]">{visibleDescription}</p>
              </div>
              {isDescriptionTruncatable ? (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded((current) => !current)}
                  className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-[#7be3ff] transition-colors hover:text-[#00f0ff]"
                >
                  {isDescriptionExpanded ? "Ver menos" : "Ver mas"}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <motion.button
            type="button"
            onClick={() => void onNativeShare()}
            disabled={isShareLinkLoading}
            whileHover={{ scale: isShareLinkLoading ? 1 : 1.02 }}
            whileTap={{ scale: isShareLinkLoading ? 1 : 0.98 }}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#00f0ff]/55 bg-[#00f0ff]/20 px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_22px_rgba(0,240,255,0.18)] transition hover:bg-[#00f0ff]/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Share2 className="h-4 w-4" />
            {isShareLinkLoading ? "Preparando link..." : "Compartir perfil"}
          </motion.button>

          <motion.button
            type="button"
            onClick={() => void onCopyShare()}
            disabled={isShareLinkLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/22 bg-white/10 px-4 py-2 text-sm font-bold text-[#eaf7ff] transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Copy className="h-4 w-4" />
            Copiar enlace
          </motion.button>

          <div className="rounded-2xl border border-white/12 bg-black/14 px-3 py-3">
            <p className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.16em] text-[#7be3ff]">
              Elegi donde compartir
            </p>
            <div className="grid grid-cols-5 gap-2">
              {SOCIAL_SHARE_ACTIONS.map(({ network, label, Icon }) => (
                <motion.button
                  key={network}
                  type="button"
                  onClick={() => void onShareToNetwork(network)}
                  whileHover={{ y: -2, scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="group flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-white/16 bg-white/10 px-1 py-2 text-[#eaf7ff] transition hover:border-[#00f0ff]/45 hover:bg-[#00f0ff]/12"
                  aria-label={`Compartir en ${label}`}
                  title={`Compartir en ${label}`}
                >
                  <Icon className="h-5 w-5 transition group-hover:text-[#7be3ff]" />
                  <span className="max-w-full truncate text-[10px] font-black leading-none">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {feedback ? (
          <motion.p
            className="mt-3 rounded-2xl border border-[#00f0ff]/22 bg-[#00f0ff]/10 px-3 py-2 text-center text-xs font-bold text-[#eaf7ff]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {feedback}
          </motion.p>
        ) : null}
      </motion.div>
    </motion.section>
  )
}
