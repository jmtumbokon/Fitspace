'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Chip from '@/components/Chip'
import { SEASONS } from '@/lib/constants'

export type ExploreFilters = {
  q: string
  season: string
  tags: string[]
  max: number | null
}

const PRICE_MAX = 1000
const PRICE_STEP = 25

export default function ExploreControls({
  trending,
  aestheticOptions,
  initial,
}: {
  trending: string[]
  aestheticOptions: string[]
  initial: ExploreFilters
}) {
  const router = useRouter()
  const [q, setQ] = useState(initial.q)
  const [open, setOpen] = useState(
    Boolean(initial.season || initial.tags.length > 0 || initial.max != null)
  )

  const apply = (next: Partial<ExploreFilters>) => {
    const merged: ExploreFilters = {
      q,
      season: initial.season,
      tags: initial.tags,
      max: initial.max,
      ...next,
    }
    const params = new URLSearchParams()
    if (merged.q.trim()) params.set('q', merged.q.trim())
    if (merged.season) params.set('season', merged.season)
    if (merged.tags.length > 0) params.set('tags', merged.tags.join(','))
    if (merged.max != null) params.set('max', String(merged.max))
    router.push(`/explore${params.size > 0 ? `?${params}` : ''}`)
  }

  const toggleTag = (tag: string) => {
    apply({
      tags: initial.tags.includes(tag)
        ? initial.tags.filter((t) => t !== tag)
        : [...initial.tags, tag],
    })
  }

  const activeFilters =
    (initial.season ? 1 : 0) + initial.tags.length + (initial.max != null ? 1 : 0)

  return (
    <div>
      {/* Search bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          apply({ q })
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
            placeholder="Search fits, occasions, styles…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/60"
          />
        </div>
        <button
          type="submit"
          className="rounded-pill bg-ink px-5 py-[11px] text-sm font-semibold text-bg transition-colors duration-[250ms] hover:bg-rust"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`rounded-pill border px-4 py-[11px] text-sm font-medium transition-all duration-[220ms] ${
            open || activeFilters > 0
              ? 'border-ink bg-ink text-bg'
              : 'border-line bg-panel text-ink-soft hover:border-ink-soft hover:text-ink'
          }`}
        >
          Filters{activeFilters > 0 && ` · ${activeFilters}`}
        </button>
      </form>

      {/* Trending events */}
      {trending.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[2px] text-rust">
            Trending events
          </div>
          <div className="flex flex-wrap gap-2">
            {trending.map((tag) => (
              <Chip
                key={tag}
                on={initial.q === tag}
                onClick={() => {
                  setQ(tag)
                  apply({ q: tag })
                }}
              >
                {tag}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Filter drawer */}
      <div
        className={`overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(.4,0,.2,1)] ${
          open ? 'max-h-[420px]' : 'max-h-0'
        }`}
      >
        <div className="mt-4 rounded-card border border-line bg-panel p-5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[2px] text-rust">
            Season
          </div>
          <div className="flex flex-wrap gap-2">
            {SEASONS.map((season) => (
              <Chip
                key={season}
                on={initial.season === season}
                onClick={() => apply({ season: initial.season === season ? '' : season })}
              >
                {season}
              </Chip>
            ))}
          </div>

          {aestheticOptions.length > 0 && (
            <>
              <div className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[2px] text-rust">
                Aesthetic
              </div>
              <div className="flex flex-wrap gap-2">
                {aestheticOptions.map((tag) => (
                  <Chip key={tag} on={initial.tags.includes(tag)} onClick={() => toggleTag(tag)}>
                    {tag}
                  </Chip>
                ))}
              </div>
            </>
          )}

          <div className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[2px] text-rust">
            Total outfit cost
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={PRICE_STEP}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={initial.max ?? PRICE_MAX}
              onChange={(e) => {
                const value = Number(e.target.value)
                apply({ max: value >= PRICE_MAX ? null : value })
              }}
              className="w-full max-w-[280px] accent-ink"
            />
            <span className="whitespace-nowrap text-[13px] font-medium text-ink-soft">
              {initial.max != null ? `under $${initial.max}` : 'any price'}
            </span>
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={() => apply({ season: '', tags: [], max: null })}
                className="ml-auto text-[13px] font-medium text-rust hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
