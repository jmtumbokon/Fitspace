'use client'

import { useState, useTransition } from 'react'
import { ratePost, type RatingScores } from '@/app/actions/ratings'

// Fit ratings panel (closet design language): aggregate score bars up top,
// the viewer's three 1–10 sliders below. One rating per user per post —
// the DB primary key makes resubmitting an update.

const ASPECTS = [
  { key: 'creativity', label: 'creativity' },
  { key: 'wearability', label: 'wearability' },
  { key: 'overall', label: 'overall' },
] as const

const DEFAULT_SCORES: RatingScores = { creativity: 5, wearability: 5, overall: 5 }

export default function RatingPanel({
  postId,
  isOwner,
  initial,
  averages,
  count,
}: {
  postId: string
  isOwner: boolean
  initial: RatingScores | null
  averages: RatingScores | null // null until the post has ratings
  count: number
}) {
  const [scores, setScores] = useState<RatingScores>(initial ?? DEFAULT_SCORES)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const hasRated = initial != null

  const setScore = (key: keyof RatingScores, value: number) => {
    setSaved(false)
    setScores((prev) => ({ ...prev, [key]: value }))
  }

  const submit = () => {
    setError(null)
    startTransition(async () => {
      const { error } = await ratePost(postId, scores)
      if (error) {
        setError(error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <div className="rounded-card border border-line bg-panel p-5">
      <div className="flex items-baseline justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[2px] text-rust">
          Fit ratings
        </div>
        {count > 0 && (
          <span className="text-[11.5px] text-ink-soft">
            {count} {count === 1 ? 'rating' : 'ratings'}
          </span>
        )}
      </div>

      {/* Aggregates — the three community averages as bars */}
      {averages ? (
        <div className="mt-3 flex flex-col gap-[9px]">
          {ASPECTS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-[88px] shrink-0 text-[12px] text-ink-soft">{label}</span>
              <div className="h-[6px] flex-1 overflow-hidden rounded-pill bg-bg2">
                <div
                  className="h-full rounded-pill bg-rust transition-[width] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
                  style={{ width: `${averages[key] * 10}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-serif text-[15px] font-medium">
                {averages[key].toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[13px] text-ink-soft">
          {isOwner ? 'No ratings yet.' : 'No ratings yet — be the first to rate this fit.'}
        </p>
      )}

      {/* The viewer's rating — owners see aggregates only */}
      {!isOwner && (
        <div className="mt-4 border-t border-line-soft pt-4">
          <div className="mb-3 text-[12px] font-semibold">
            {hasRated ? 'Your rating' : 'Rate this fit'}
          </div>
          <div className="flex flex-col gap-[10px]">
            {ASPECTS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3">
                <span className="w-[88px] shrink-0 text-[12px] text-ink-soft">{label}</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={scores[key]}
                  onChange={(e) => setScore(key, Number(e.target.value))}
                  className="flex-1 accent-ink"
                />
                <span className="w-8 shrink-0 text-right font-serif text-[15px] font-medium">
                  {scores[key]}
                </span>
              </label>
            ))}
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">{error}</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={pending || saved}
              className="rounded-pill bg-ink px-5 py-[9px] text-[13px] font-semibold text-bg transition-colors duration-[250ms] hover:bg-rust disabled:opacity-60"
            >
              {pending
                ? 'Saving…'
                : saved
                  ? 'Saved'
                  : hasRated
                    ? 'Update rating'
                    : 'Save rating'}
            </button>
            {saved && (
              <span className="text-[12px] text-ink-soft">Averages refresh as others rate.</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
