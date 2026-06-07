import Link from 'next/link'

// Underline sub-tabs inside a view head — for sections that share one nav
// tab (the feed section: closet wall / challenges). Server-renderable; the
// active underline sits on the view head's bottom border.

export const FEED_SECTION_TABS = [
  { href: '/feed', label: 'Closet wall' },
  { href: '/challenges', label: 'Challenges' },
]

export default function SectionTabs({
  tabs,
  active,
}: {
  tabs: { href: string; label: string }[]
  active: string
}) {
  return (
    <div className="-mb-4 mt-4 flex gap-6">
      {tabs.map((tab) => {
        const on = tab.href === active
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={on ? 'page' : undefined}
            className={`border-b-2 pb-[14px] text-[12px] font-semibold uppercase tracking-[1.5px] transition-colors duration-[220ms] ${
              on ? 'border-rust text-ink' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
