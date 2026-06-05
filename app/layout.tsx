import type { Metadata, Viewport } from 'next'
import Navigation from '@/components/Navigation'
import './globals.css'

export const metadata: Metadata = {
  title: 'FitSpace',
  description: 'Share your fits, build your wardrobe.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <Navigation />
        {/* Bottom padding clears the mobile tab bar; left margin clears the desktop sidebar */}
        <main className="pb-20 md:ml-56 md:pb-0">{children}</main>
      </body>
    </html>
  )
}
