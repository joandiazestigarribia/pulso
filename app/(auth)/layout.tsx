import { ScanlineGrid } from "@/components/auth/scanline-grid"
import { CampgroundHeader } from "@/components/auth/campground-header"

export default function CampgroundLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-carbon overflow-hidden">
      <ScanlineGrid />
      <CampgroundHeader />
      {children}
    </div>
  )
}
