import { LoginForm } from "@/components/auth/login-form"
import { AuthFooter } from "@/components/auth/auth-footer"

export default function LoginPage() {
  return (
    <main className="relative z-10 mx-auto flex flex-col min-h-screen w-full max-w-300 items-center px-4 pb-8 pt-24">
      <article className="mb-5 mx-auto w-full max-w-125 text-center rounded-[28px] border border-white/15 bg-[#090d25]/45 p-5 shadow-[0_10px_18px_rgba(0,0,0,0.28)] ring-1 ring-[#00f0ff]/15 backdrop-blur-sm">
        <h1 className="text-[#f8eeaf] bg-clip-text text-l font-medium leading-tight md:text-l">
          Iniciá sesión para desbloquear más funcionalidades.
        </h1>
      </article>
      <section className="mx-auto w-full max-w-115 overflow-hidden rounded-[28px] bg-[#090d25]/45 p-4 text-[#eaf7ff] backdrop-blur-sm md:p-6">
        <div className="mt-6 flex items-center justify-center">
          <LoginForm />
        </div>

        <div className="px-2 pt-6 md:px-2">
          <AuthFooter />
        </div>
      </section>
    </main>
  )
}
