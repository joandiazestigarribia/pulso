"use client"

import { use } from "react"
import { GuessBuilder } from "@/components/landings/guess/guess-builder"

interface GuessEditPageProps {
  params: Promise<{ id: string }>
}

export default function GuessEditPage({ params }: GuessEditPageProps) {
  const { id } = use(params)

  return (
    <main className="relative mx-auto w-full max-w-7xl overflow-hidden px-4 pb-8 pt-24 text-[#eaf7ff] selection:bg-[#ff4ef5] selection:text-black">
      <div className="bg-scene-battle pointer-events-none fixed inset-0 z-0 opacity-90" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.14),transparent_45%),radial-gradient(circle_at_75%_15%,rgba(255,67,248,0.2),transparent_45%),linear-gradient(180deg,rgba(8,11,26,0.74),rgba(8,11,26,0.92))]" />

      <section className="relative z-10 mx-auto w-full max-w-300 py-6">
        <GuessBuilder playlistId={id} />
      </section>
    </main>
  )
}
