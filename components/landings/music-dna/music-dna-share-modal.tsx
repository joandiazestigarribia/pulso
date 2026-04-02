import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Copy } from "lucide-react"

type ShareNetwork = "x" | "whatsapp" | "telegram" | "facebook" | "instagram"
const DESCRIPTION_PREVIEW_MAX_CHARS = 180

interface MusicDnaShareModalProps {
  isOpen: boolean
  onClose: () => void
  personaName: string
  personaAssetFile: string
  headline: string
  description: string
  feedback: string | null
  onCopyShare: () => void
  onShareToNetwork: (network: ShareNetwork) => void
}

export function MusicDnaShareModal({
  isOpen,
  onClose,
  personaName,
  personaAssetFile,
  headline,
  description,
  feedback,
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
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      onClick={onClose}
    >
      <motion.div
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-140 flex-col overflow-hidden rounded-3xl border-[3px] border-[#00f0ff]/35 bg-[#0f1638]/92 p-4 text-[#eaf7ff] shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b-2 border-[#00f0ff]/25 pb-3">
          <div>
            <h3 className="mt-1 bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-2xl font-black uppercase leading-none text-transparent">
              Compartir tu perfil sonoro
            </h3>
            <p className="mt-1 text-xs font-semibold text-[#d8ebff]">{headline}</p>
          </div>
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border-2 border-white/35 text-sm font-medium text-white hover:bg-white/15"
            aria-label="Cerrar modal"
          >
            X
          </motion.button>
        </div>

        <div className="mt-4 rounded-[18px] border-2 border-[#00f0ff]/25 bg-[#121a40]/85 p-3">
          <div className="flex items-center gap-4">
            <motion.div
              className="relative mx-auto flex w-full max-w-42 justify-center rounded-[18px] border border-[#ff43f8]/35 bg-[#0f1638] px-2 py-3 shadow-[0_0_24px_rgba(0,240,255,0.25)]"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
                <Image
                  src={`/images/characters/${personaAssetFile}`}
                  alt={`${personaName} avatar`}
                  width={190}
                  height={220}
                  className="h-auto w-full rounded-[12px] object-cover drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]"
                  priority
                />
            </motion.div>

            <div>
              <div className="mx-auto w-full max-w-95 rounded-2xl border border-[#ff43f8]/35 bg-[#111739]/90 px-3 py-3 text-center shadow-[inset_0_0_0_1px_rgba(0,240,255,0.14)]">
                <p className="mt-1 bg-gradient-to-r from-[#ff43f8] via-[#ffe600] to-[#95ffc8] bg-clip-text font-sonic-persona text-[20px] font-black uppercase leading-[0.92] text-transparent">
                  {personaName}
                </p>
              </div>
              <div
                className={`mt-3 rounded-xl border border-white/12 bg-black/20 px-3 py-2 ${
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

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-medium uppercase tracking-wide">
          <motion.button
            type="button"
            onClick={onCopyShare}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/35 bg-white/15 px-3 py-2 text-[#eaf7ff] transition hover:brightness-105"
          >
            <Copy className="h-4 w-4" />
            Copiar link
          </motion.button>
          <motion.button
            type="button"
            onClick={() => onShareToNetwork("x")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl border-2 border-white/35 bg-white/10 px-3 py-2 text-[#eaf7ff] transition hover:brightness-105"
          >
            Compartir en X
          </motion.button>
          <motion.button
            type="button"
            onClick={() => onShareToNetwork("whatsapp")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl border-2 border-white/35 bg-white/10 px-3 py-2 text-[#eaf7ff] transition hover:brightness-105"
          >
            Compartir en Whatsapp
          </motion.button>
          <motion.button
            type="button"
            onClick={() => onShareToNetwork("telegram")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl border-2 border-white/35 bg-white/10 px-3 py-2 text-[#eaf7ff] transition hover:brightness-105"
          >
            Compartir en Telegram
          </motion.button>
          <motion.button
            type="button"
            onClick={() => onShareToNetwork("facebook")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl border-2 border-white/35 bg-white/10 px-3 py-2 text-[#eaf7ff] transition hover:brightness-105"
          >
            Compartir en Facebook
          </motion.button>
          <motion.button
            type="button"
            onClick={() => onShareToNetwork("instagram")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl border-2 border-white/35 bg-white/10 px-3 py-2 text-[#eaf7ff] transition hover:brightness-105"
          >
            Compartir en Instagram
          </motion.button>
        </div>

        {feedback ? (
          <motion.p
            className="mt-3 rounded-lg border border-white/25 bg-white/15 px-3 py-2 text-xs font-bold text-[#eaf7ff]"
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
