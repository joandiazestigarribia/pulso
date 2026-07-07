import type { Metadata } from 'next'
import { Space_Grotesk, Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthSessionBootstrap } from "@/components/auth/auth-session-bootstrap"
import './globals.css'

const _spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: '--font-mono',
})

const _outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: "Pulso - Versus Musical",
  description: "Descubrí tu perfil musical votando canciones en versus uno contra uno.",
  openGraph: {
    title: "Pulso - Versus Musical",
    description: "Compará canciones, votá tus favoritas y desbloqueá tu perfil musical.",
    siteName: "Pulso",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulso - Versus Musical",
    description: "Compará canciones, votá tus favoritas y desbloqueá tu perfil musical.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-AR" className={`${_spaceGrotesk.variable} ${_outfit.variable}`}>
      <body className="font-sans antialiased bg-carbon text-foreground min-h-screen">
        <AuthSessionBootstrap />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
