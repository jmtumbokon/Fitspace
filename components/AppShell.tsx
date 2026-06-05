'use client'

import { usePathname } from 'next/navigation'
import Navigation from '@/components/Navigation'

// Routes that render full-screen without the tab bar / sidebar chrome.
const BARE_ROUTES = ['/login', '/signup', '/onboarding', '/auth']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const bare = BARE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (bare) {
    return <main>{children}</main>
  }

  return (
    <>
      <Navigation />
      {/* Bottom padding clears the mobile tab bar; left margin clears the desktop sidebar */}
      <main className="pb-20 md:ml-56 md:pb-0">{children}</main>
    </>
  )
}
