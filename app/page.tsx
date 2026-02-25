import Link from "next/link"
import { ArrowRight, Flame, Radio, Shield, Sparkles, Trophy, Waves } from "lucide-react"
import { homeFeatures, homeModules, type ModuleStatus } from "@/lib/home-config"

const statusClasses: Record<ModuleStatus, string> = {
  Live: "bg-[#00FF66] text-black",
  "In Progress": "bg-[#FFE600] text-black",
  Planned: "bg-white/20 text-white",
}

export default function HomePage() {
  return (
    <main className="relative z-10 min-h-screen overflow-hidden bg-black px-4 pb-12 pt-8 text-white md:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40">
        <div className="absolute -left-[8%] -top-[12%] h-[46%] w-[46%] rounded-full bg-[#AD00FF] blur-[120px]" />
        <div className="absolute -bottom-[15%] -right-[8%] h-[48%] w-[48%] rounded-full bg-[#00F0FF] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.12) 2px, rgba(0,255,136,0.12) 4px)" }} />
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 pt-16">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-white/15 bg-black/60 px-4 py-1.5 text-[11px] font-mono font-bold uppercase tracking-widest">
          <Sparkles className="h-3.5 w-3.5 text-[#00FF66]" />
          Pulso Main Hub
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[28px] border-4 border-black bg-[#111111]/90 p-6 shadow-[0_10px_0_0_rgba(0,0,0,0.25)] backdrop-blur lg:p-8">
            <h1 className="max-w-xl text-4xl font-black uppercase leading-[0.95] tracking-tight drop-shadow-[2px_2px_0_rgba(0,0,0,1)] md:text-5xl">
              Pulso
              <span className="block text-[#00F0FF]">Music Battle Platform</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-white/75 md:text-base">
              Pantalla principal para presentar vision, estado del producto y accesos clave. Esta Home esta preparada para crecer por bloques sin romper la estructura general.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/battle"
                className="inline-flex items-center gap-2 rounded-2xl border-4 border-black bg-[#00FF66] px-5 py-3 text-sm font-black uppercase tracking-wide text-black shadow-[0_8px_0_0_rgba(0,0,0,0.25)] transition-all hover:brightness-110 active:translate-y-1 active:shadow-none"
              >
                Entrar a Battle
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl border-4 border-black bg-[#FFE600] px-5 py-3 text-sm font-black uppercase tracking-wide text-black shadow-[0_8px_0_0_rgba(0,0,0,0.25)] transition-all hover:brightness-110 active:translate-y-1 active:shadow-none"
              >
                Tactical Login
                <Shield className="h-4 w-4" />
              </Link>
            </div>
          </article>

          <aside className="rounded-[28px] border-4 border-black bg-[#171717]/90 p-6 shadow-[0_10px_0_0_rgba(0,0,0,0.25)]">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 -rotate-6 items-center justify-center rounded-xl border-4 border-black bg-[#FF2A6D] shadow-[0_6px_0_0_rgba(0,0,0,0.25)]">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight">Roadmap Vivo</h2>
            </div>

            <ul className="space-y-2.5">
              {homeModules.map((module) => (
                <li key={module.name} className="flex items-center justify-between rounded-xl border-2 border-white/10 bg-black/40 px-3 py-2">
                  {module.href ? (
                    <Link href={module.href} className="text-sm font-semibold text-white/90 transition-colors hover:text-[#00F0FF]">
                      {module.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-white/90">{module.name}</span>
                  )}
                  <span className={`rounded-md px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wide ${statusClasses[module.status]}`}>
                    {module.status}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="relative z-10 mx-auto mt-6 grid w-full max-w-6xl gap-4 md:grid-cols-3">
        {homeFeatures.map((feature) => (
          <article
            key={feature.title}
            className="rounded-3xl border-[3px] border-black bg-[#151515] p-5 shadow-[0_8px_0_0_rgba(0,0,0,0.25)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-lg border-2 border-black px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-black" style={{ backgroundColor: feature.accent }}>
                {feature.tag}
              </span>
              <Waves className="h-4 w-4 text-white/45" />
            </div>
            <h3 className="text-lg font-black uppercase leading-tight">{feature.title}</h3>
            <p className="mt-2 text-sm text-white/70">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="relative z-10 mx-auto mt-6 grid w-full max-w-6xl gap-4 rounded-3xl border-4 border-black bg-[#101010]/85 p-5 shadow-[0_10px_0_0_rgba(0,0,0,0.25)] md:grid-cols-3">
        <div className="rounded-2xl border-2 border-white/10 bg-black/40 p-4">
          <div className="mb-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#00F0FF]">Vision</div>
          <p className="text-sm text-white/80">Competencia musical rapida, expresiva y social.</p>
        </div>
        <div className="rounded-2xl border-2 border-white/10 bg-black/40 p-4">
          <div className="mb-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#00FF66]">Experiencia</div>
          <p className="text-sm text-white/80">Interfaz de alto contraste con feedback inmediato.</p>
        </div>
        <div className="rounded-2xl border-2 border-white/10 bg-black/40 p-4">
          <div className="mb-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#FFE600]">Escalabilidad</div>
          <p className="text-sm text-white/80">Secciones y modulos definidos por config para crecer sin friccion.</p>
        </div>
      </section>

      <footer className="relative z-10 mx-auto mt-6 flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t-2 border-white/10 pt-4">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#AD00FF] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow-[0_6px_0_0_rgba(0,0,0,0.25)]">
          <Radio className="h-3.5 w-3.5" />
          PULSO CORE v0.1
        </div>

        <Link
          href="/battle"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 bg-black px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-black"
        >
          Ir a Arena
          <Trophy className="h-3.5 w-3.5" />
        </Link>
      </footer>
    </main>
  )
}
