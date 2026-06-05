import type { Metadata, Viewport } from 'next'
import AppShell from '@/components/AppShell'
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
