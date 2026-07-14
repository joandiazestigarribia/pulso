import { Flame } from "lucide-react"
import Link from "next/link"

type FooterLink = {
  href: string
  label: string
}

const footerLinks: FooterLink[] = [
  { href: "/battle", label: "versus" },
  { href: "/music-dna", label: "perfil sonoro" },
  { href: "/login", label: "entrar" },
]

export function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative z-10 px-4 pb-5 pt-2 text-[#eaf7ff] md:px-6 md:pb-6">
      <div className="mx-auto w-full max-w-300 border-t border-white/15">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#00f0ff]/45 to-transparent" />
        <div className="flex items-center justify-between gap-6 py-4 sm:gap-5 sm:py-5">
          <div className="flex items-center gap-2.5">
            <Flame className="h-3.5 w-3.5 text-[#7bb7ff] sm:h-4 sm:w-4" />
            <span className="text-sm font-black lowercase tracking-tight text-white sm:text-base">pulso campfire</span>
            <span className="text-xs font-bold text-white/35 sm:text-sm">{currentYear}</span>
          </div>

          <nav
            aria-label="Navegacion del pie"
            className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-7"
          >
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-black lowercase text-white/65 transition-colors hover:text-white sm:text-sm sm:text-white/70"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
