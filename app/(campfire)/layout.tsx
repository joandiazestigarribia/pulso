import { ForestBackground } from "@/components/campfire/forest-background"
import { CampfireHeader } from "@/components/campfire/campfire-header"

export default function CampfireLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-campfire-deep overflow-hidden">
      <ForestBackground />
      <CampfireHeader />
      {children}
    </div>
  )
}
