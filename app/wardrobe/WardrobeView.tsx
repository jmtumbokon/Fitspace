'use client'

import { useMemo, useState } from 'react'
import Chip from '@/components/Chip'
import DrawerSection from '@/components/DrawerSection'
import WardrobeItemCard from '@/components/WardrobeItemCard'
import { WARDROBE_CATEGORIES } from '@/lib/constants'
import type { WardrobeItem } from '@/types'
import AddItemForm from './AddItemForm'

type Filter = 'all' | 'most-worn' | 'underused' | 'wishlist'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'most-worn', label: 'Most worn' },
  { key: 'underused', label: 'Underused' },
  { key: 'wishlist', label: 'Wishlist' },
]

export default function WardrobeView({
  items,
  userId,
}: {
  items: WardrobeItem[]
  userId: string
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [adding, setAdding] = useState(false)

  const visible = useMemo(() => {
    switch (filter) {
      case 'wishlist':
        return items.filter((item) => item.is_wishlist)
      case 'most-worn':
        return items
          .filter((item) => !item.is_wishlist && item.times_worn > 0)
          .sort((a, b) => b.times_worn - a.times_worn)
      case 'underused':
        return items.filter((item) => !item.is_wishlist && item.times_worn <= 1)
      default:
        return items.filter((item) => !item.is_wishlist)
    }
  }, [items, filter])

  // Group into one drawer per category; uncategorized pieces get their own
  const drawers = useMemo(() => {
    const byCategory = new Map<string, WardrobeItem[]>()
    for (const item of visible) {
      const key = item.category ?? 'uncategorized'
      const list = byCategory.get(key) ?? []
      list.push(item)
      byCategory.set(key, list)
    }
    const ordered: { name: string; items: WardrobeItem[] }[] = []
    for (const category of [...WARDROBE_CATEGORIES, 'uncategorized']) {
      const list = byCategory.get(category)
      if (list && list.length > 0) {
        ordered.push({ name: category, items: list })
      }
    }
    return ordered
  }, [visible])

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map(({ key, label }) => (
          <Chip key={key} on={filter === key} onClick={() => setFilter(key)}>
            {label}
          </Chip>
        ))}
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          className="ml-auto rounded-pill bg-ink px-[18px] py-[9px] text-sm font-semibold text-bg transition-all duration-[250ms] hover:-translate-y-px hover:bg-rust"
        >
          {adding ? 'Close' : '+ Add item'}
        </button>
      </div>

      {adding && (
        <div className="mb-5">
          <AddItemForm userId={userId} onDone={() => setAdding(false)} />
        </div>
      )}

      {drawers.length === 0 ? (
        <p className="rounded-card border border-line bg-panel px-5 py-16 text-center text-sm text-ink-soft">
          {filter === 'wishlist'
            ? 'Nothing on the wishlist yet.'
            : 'Your closet is empty — add your first piece.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {drawers.map((drawer, i) => (
            <DrawerSection
              key={`${filter}-${drawer.name}`}
              name={drawer.name}
              count={drawer.items.length}
              defaultOpen={i === 0}
            >
              {drawer.items.map((item) => (
                <WardrobeItemCard key={item.id} item={item} />
              ))}
            </DrawerSection>
          ))}
        </div>
      )}
    </div>
  )
}
