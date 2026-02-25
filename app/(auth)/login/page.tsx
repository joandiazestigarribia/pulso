import { LoginForm } from "@/components/auth/login-form"
import { TacticalFooter } from "@/components/auth/tactical-footer"
import { Ticket } from "lucide-react"

export default function LoginPage() {
  return (
    <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
      <div className="hidden lg:grid absolute right-8 top-1/2 -translate-y-1/2 grid-cols-3 gap-2">
        {["bg-neon-magenta", "bg-neon-cyan", "bg-neon-yellow", "bg-neon-pink", "bg-neon-green", "bg-neon-magenta", "bg-foreground/30", "bg-foreground/20", "bg-foreground/10"].map(
          (color, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${color}`}
            />
          )
        )}
      </div>

      <div className="hidden lg:block absolute left-8 bottom-24">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          className="text-foreground/15"
        >
          <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="1" />
          <circle cx="24" cy="24" r="2" stroke="currentColor" strokeWidth="1" />
          <line x1="24" y1="4" x2="24" y2="12" stroke="currentColor" strokeWidth="1" />
          <line x1="24" y1="36" x2="24" y2="44" stroke="currentColor" strokeWidth="1" />
          <line x1="4" y1="24" x2="12" y2="24" stroke="currentColor" strokeWidth="1" />
          <line x1="36" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      <LoginForm />

      <div className="mt-12">
        <TacticalFooter />
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <button
          className="w-14 h-14 rounded-full bg-neon-green flex items-center justify-center glow-green hover:scale-110 transition-transform"
          aria-label="Support ticket"
        >
          <Ticket className="w-6 h-6 text-carbon" />
        </button>
      </div>
    </main>
  )
}
