import { CampgroundHeader } from "@/components/auth/campground-header"

export default function CampfireLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-campfire-deep overflow-hidden">
      <CampgroundHeader />
      {children}
    </div>
  )
}
