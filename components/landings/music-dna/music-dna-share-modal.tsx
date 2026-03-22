import Image from "next/image"
import { Copy, Share2 } from "lucide-react"

type ShareNetwork = "x" | "whatsapp" | "telegram" | "facebook"

interface MusicDnaShareModalProps {
  isOpen: boolean
  onClose: () => void
  personaName: string
  personaAssetFile: string
  headline: string
  description: string
  feedback: string | null
  onNativeShare: () => void
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
  onNativeShare,
  onCopyShare,
  onShareToNetwork,
}: MusicDnaShareModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <section className="fixed inset-0 z-70 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-140 rounded-3xl border-[3px] border-[#00f0ff]/35 bg-[#0f1638]/92 p-4 text-[#eaf7ff] shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-3 border-b-2 border-[#00f0ff]/25 pb-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7be3ff]">Compartir Music DNA</p>
            <h3 className="mt-1 bg-gradient-to-r from-[#00f0ff] via-[#ff43f8] to-[#ffe600] bg-clip-text text-2xl font-black uppercase leading-none text-transparent">
              Preview de perfil sonoro
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border-2 border-white/35 px-2 py-1 text-xs font-black uppercase hover:bg-white/15"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4 rounded-[18px] border-2 border-[#00f0ff]/25 bg-[#121a40]/85 p-3">
          <div className="flex items-center gap-3">
            <div className="relative h-20 w-20 overflow-hidden rounded-[14px] border-2 border-white/30">
              <Image
                src={`/images/characters/${personaAssetFile}`}
                alt={`${personaName} avatar`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7be3ff]">Avatar</p>
              <p className="font-sonic-persona text-2xl leading-none">{personaName}</p>
              <p className="mt-1 text-sm font-bold">{headline}</p>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-[#d8ebff]">{description}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-black uppercase tracking-wide">
          <button
            type="button"
            onClick={onNativeShare}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#2d3d7f] bg-[#4968bb] px-3 py-2 text-[#f8eecf] hover:brightness-110"
          >
            <Share2 className="h-4 w-4" />
            Share nativo
          </button>
          <button
            type="button"
            onClick={onCopyShare}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/35 bg-white/15 px-3 py-2 text-[#eaf7ff] hover:brightness-105"
          >
            <Copy className="h-4 w-4" />
            Copiar link
          </button>
          <button
            type="button"
            onClick={() => onShareToNetwork("x")}
            className="rounded-xl border-2 border-white/35 bg-white/10 px-3 py-2 text-[#eaf7ff] hover:brightness-105"
          >
            Compartir en X
          </button>
          <button
            type="button"
            onClick={() => onShareToNetwork("whatsapp")}
            className="rounded-xl border-2 border-white/35 bg-white/10 px-3 py-2 text-[#eaf7ff] hover:brightness-105"
          >
            Compartir en WhatsApp
          </button>
          <button
            type="button"
            onClick={() => onShareToNetwork("telegram")}
            className="rounded-xl border-2 border-white/35 bg-white/10 px-3 py-2 text-[#eaf7ff] hover:brightness-105"
          >
            Compartir en Telegram
          </button>
          <button
            type="button"
            onClick={() => onShareToNetwork("facebook")}
            className="rounded-xl border-2 border-white/35 bg-white/10 px-3 py-2 text-[#eaf7ff] hover:brightness-105"
          >
            Compartir en Facebook
          </button>
        </div>

        {feedback ? (
          <p className="mt-3 rounded-lg border border-white/25 bg-white/15 px-3 py-2 text-xs font-bold text-[#eaf7ff]">
            {feedback}
          </p>
        ) : null}
      </div>
    </section>
  )
}
