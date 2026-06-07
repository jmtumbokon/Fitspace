'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Bell + unread badge linking to /notifications. Lives in the mobile page
// header and the desktop sidebar brand row — not a nav tab. The count is
// re-fetched on every route change; RLS scopes it to the signed-in user.

export default function NotificationBell({ className = 'text-ink' }: { className?: string }) {
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let cancelled = false
    createClient()
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false)
      .then(({ count }) => {
        if (!cancelled) setUnread(count ?? 0)
      })
    return () => {
      cancelled = true
    }
  }, [pathname])

  // The notifications page marks everything read on view
  const count = pathname.startsWith('/notifications') ? 0 : unread

  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `Notifications (${count} unread)` : 'Notifications'}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-[220ms] hover:bg-black/5 ${className}`}
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>
      {count > 0 && (
        <span className="absolute right-[2px] top-[2px] flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-rust px-[3px] text-[9px] font-bold leading-none text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
