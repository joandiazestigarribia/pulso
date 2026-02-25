import type { Metadata } from 'next'
import { Space_Grotesk, Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
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
  title: 'Pulso - Music Battle Arena',
  description: 'The ultimate music duel platform. Vote for your favorite tracks in head-to-head battles.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${_spaceGrotesk.variable} ${_outfit.variable}`}>
      <body className="font-sans antialiased bg-carbon text-foreground min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
