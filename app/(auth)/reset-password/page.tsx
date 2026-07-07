import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { AuthFooter } from "@/components/auth/auth-footer"

export default function ResetPasswordPage() {
  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-300 flex-col items-center px-4 pb-8 pt-24">
      <section className="mx-auto w-full max-w-115 overflow-hidden rounded-[28px] bg-[#090d25]/45 p-4 text-[#eaf7ff] backdrop-blur-sm md:p-6">
        <div className="mt-6 flex items-center justify-center">
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
        <div className="px-2 pt-6 md:px-2">
          <AuthFooter />
        </div>
      </section>
    </main>
  )
}
