'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Chip from '@/components/Chip'

export type PickerItem = { id: string; name: string }

export default function StyleMeControls({
  items,
  initial,
}: {
  items: PickerItem[]
  initial: { q: string; itemId: string }
}) {
  const router = useRouter()
  const [q, setQ] = useState(initial.q)

  const search = (params: URLSearchParams) => {
    router.push(`/style-me${params.size > 0 ? `?${params}` : ''}`)
  }

  return (
    <div>
      {/* Mode 1: describe a piece */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const params = new URLSearchParams()
          if (q.trim()) params.set('q', q.trim())
          search(params)
        }}
        className="flex items-center gap-2"
      >
        <div className="flex flex-1 items-center gap-3 rounded-pill border border-line bg-panel px-5 py-[11px] focus-within:border-ink">
          <svg
            className="h-[18px] w-[18px] shrink-0 fill-none stroke-ink-soft"
            viewBox="0 0 24 24"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              d="M21 21l-5.197-5.197M15.803 15.803A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Describe a piece — “camo shorts”, “black mary janes”…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/60"
          />
        </div>
        <button
          type="submit"
          className="rounded-pill bg-ink px-5 py-[11px] text-sm font-semibold text-bg transition-colors duration-[250ms] hover:bg-rust"
        >
          Style it
        </button>
      </form>

      {/* Mode 2: pick from the closet */}
      <div className="mt-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[2px] text-rust">
          Or pick from your closet
        </div>
        {items.length === 0 ? (
          <p className="text-[13px] text-ink-soft">
            Your closet is empty —{' '}
            <Link href="/wardrobe" className="font-medium text-rust hover:underline">
              add pieces
            </Link>{' '}
            to style around them.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <Chip
                key={item.id}
                on={initial.itemId === item.id}
                onClick={() => {
                  setQ('')
                  const params = new URLSearchParams()
                  // Tapping the active piece again clears the search
                  if (initial.itemId !== item.id) params.set('item', item.id)
                  search(params)
                }}
              >
                {item.name}
              </Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
