'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  also?: string[] // extra routes that light this tab (section sub-tabs)
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/feed',
    label: 'Feed',
    also: ['/challenges'], // challenges is a sub-tab of the feed section
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
      </svg>
    ),
  },
  {
    href: '/explore',
    label: 'Explore',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197M15.803 15.803A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    href: '/post',
    label: 'Post',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/wardrobe',
    label: 'Wardrobe',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    href: '/notifications',
    label: 'Alerts',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
]

function NavLink({
  item,
  active,
  variant,
  badge = 0,
}: {
  item: (typeof NAV_ITEMS)[number]
  active: boolean
  variant: 'tab' | 'sidebar'
  badge?: number
}) {
  const icon = (
    <span className="relative">
      {item.icon}
      {badge > 0 && (
        <span className="absolute -right-[7px] -top-[3px] flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-rust px-[3px] text-[9px] font-bold leading-none text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </span>
  )

  if (variant === 'tab') {
    return (
      <Link
        href={item.href}
        className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
          active ? 'text-black font-semibold' : 'text-neutral-400'
        }`}
      >
        {icon}
        <span>{item.label}</span>
      </Link>
    )
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        active
          ? 'bg-neutral-100 font-semibold text-black'
          : 'text-neutral-500 hover:bg-neutral-50 hover:text-black'
      }`}
    >
      {icon}
      <span>{item.label}</span>
    </Link>
  )
}

export default function Navigation() {
  const pathname = usePathname()
  const isActive = (item: NavItem) =>
    [item.href, ...(item.also ?? [])].some(
      (href) => pathname === href || pathname.startsWith(`${href}/`)
    )

  // Unread notifications badge — re-counted on every route change; RLS
  // scopes the count to the signed-in user.
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
  const badgeFor = (item: NavItem) =>
    item.href === '/notifications' && !pathname.startsWith('/notifications') ? unread : 0

  return (
    <>
      {/* Mobile: bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item)}
            variant="tab"
            badge={badgeFor(item)}
          />
        ))}
      </nav>

      {/* Desktop: sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-56 flex-col border-r border-neutral-200 bg-white p-4 md:flex">
        <Link href="/feed" className="mb-8 px-3 text-xl font-bold tracking-tight">
          FitSpace
        </Link>
        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item)}
              variant="sidebar"
              badge={badgeFor(item)}
            />
          ))}
        </div>
      </aside>
    </>
  )
}
