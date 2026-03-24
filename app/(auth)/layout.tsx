import { CampgroundHeader } from "@/components/auth/campground-header"

export default function CampgroundLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authBackgroundStyle = {
    backgroundImage: "url('/images/home/background-home.jpg')",
    backgroundPosition: "center",
    backgroundSize: "contain",
  } as const

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080b1a] text-[#eaf7ff]">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-90" style={authBackgroundStyle} />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,240,255,0.14),transparent_45%),radial-gradient(circle_at_75%_15%,rgba(255,67,248,0.2),transparent_45%),linear-gradient(180deg,rgba(8,11,26,0.74),rgba(8,11,26,0.92))]" />
      <CampgroundHeader />
      {children}
    </div>
  )
}
