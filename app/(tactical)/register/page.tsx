import { RegisterForm } from "@/components/tactical/register-form"
import { TacticalFooter } from "@/components/tactical/tactical-footer"

export default function RegisterPage() {
  return (
    <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
      <RegisterForm />
      <div className="mt-12">
        <TacticalFooter />
      </div>
    </main>
  )
}
