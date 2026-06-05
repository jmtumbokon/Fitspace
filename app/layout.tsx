import type { Metadata, Viewport } from 'next'
import { Fraunces, Hanken_Grotesk } from 'next/font/google'
import AppShell from '@/components/AppShell'
import './globals.css'

// Editorial serif for headings, numbers, closet names
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
})

// Clean grotesk for body, UI, buttons
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hanken',
})

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
      <body
        className={`${fraunces.variable} ${hanken.variable} min-h-screen bg-white text-neutral-900 antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
