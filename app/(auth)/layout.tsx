import { ScanlineGrid } from "@/components/auth/scanline-grid"
import { TacticalHeader } from "@/components/auth/tactical-header"

export default function TacticalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-carbon overflow-hidden">
      <ScanlineGrid />
      <TacticalHeader />
      {children}
    </div>
  )
}
