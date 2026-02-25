import { CampfireHeader } from "@/components/landings/campfire-header"

export default function CampfireLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-campfire-deep overflow-hidden">
      <CampfireHeader />
      {children}
    </div>
  )
}
