'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { voteInBattle } from '@/app/actions/battles'
import { swatchFor } from '@/lib/swatch'

export type BattleSide = {
  postId: string
  imageUrl: string | null
  caption: string | null
  name: string
}

export type Battle = {
  id: string
  theme: string | null
  votesA: number
  votesB: number
  a: BattleSide
  b: BattleSide
}

// One battle: two fits side by side. Vote buttons until the viewer votes,
// then the result as percentage bars — their pick filled in rust.

export default function BattleCard({
  battle,
  initialVote,
}: {
  battle: Battle
  initialVote: string | null // voted_for post id, if the viewer already voted
}) {
  const [vote, setVote] = useState(initialVote)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const castVote = (postId: string) => {
    if (vote || pending) return
    setError(null)
    setVote(postId) // optimistic — the insert is final, no un-vote
    startTransition(async () => {
      const { error } = await voteInBattle(battle.id, postId)
      if (error) {
        setVote(initialVote)
        setError(error)
      }
    })
  }

  // The server counts only persisted votes; add the optimistic one locally
  const optimistic = vote != null && initialVote == null
  const votesA = battle.votesA + (optimistic && vote === battle.a.postId ? 1 : 0)
  const votesB = battle.votesB + (optimistic && vote === battle.b.postId ? 1 : 0)
  const total = votesA + votesB
  const pctA = total > 0 ? Math.round((votesA / total) * 100) : 0
  const pctB = total > 0 ? 100 - pctA : 0

  const renderSide = (side: BattleSide, votes: number, pct: number, seed: number) => {
    const picked = vote === side.postId
    return (
      <div className="min-w-0">
        <Link
          href={`/post/${side.postId}`}
          className="group block overflow-hidden rounded-[10px] border border-line-soft bg-bg2"
        >
          <div
            className="relative aspect-[4/5]"
            style={side.imageUrl ? undefined : { background: swatchFor(side.postId, seed) }}
          >
            {side.imageUrl && (
              <Image
                src={side.imageUrl}
                alt={side.caption ?? `fit by ${side.name}`}
                fill
                sizes="(min-width: 768px) 320px, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,.2),transparent_55%)]" />
          </div>
        </Link>
        <div className="mt-2 truncate text-center text-[10.5px] font-bold uppercase tracking-[.4px] text-sage">
          {side.name}
        </div>

        {vote == null ? (
          <button
            type="button"
            onClick={() => castVote(side.postId)}
            disabled={pending}
            className="mt-2 w-full rounded-pill bg-ink py-[9px] text-[13px] font-semibold text-bg transition-colors duration-[250ms] hover:bg-rust disabled:opacity-60"
          >
            Vote this fit
          </button>
        ) : (
          <div className="mt-2">
            <div className="h-[8px] overflow-hidden rounded-pill bg-bg2">
              <div
                className={`h-full rounded-pill transition-[width] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${
                  picked ? 'bg-rust' : 'bg-ink/35'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-[6px] flex items-baseline justify-between text-[11.5px] text-ink-soft">
              <span className="font-serif text-[15px] font-medium text-ink">{pct}%</span>
              <span>
                {votes} {votes === 1 ? 'vote' : 'votes'}
                {picked && <b className="ml-[6px] font-semibold text-rust">your pick</b>}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-card border border-line bg-panel p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="truncate text-[11px] font-semibold uppercase tracking-[2px] text-rust">
          {battle.theme ?? 'Style battle'}
        </div>
        {vote == null && total > 0 && (
          <span className="shrink-0 text-[11.5px] text-ink-soft">
            {total} {total === 1 ? 'vote' : 'votes'} so far
          </span>
        )}
      </div>

      <div className="relative grid grid-cols-2 gap-3">
        {renderSide(battle.a, votesA, pctA, 0)}
        {renderSide(battle.b, votesB, pctB, 1)}
        {/* vs medallion over the seam */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[32%] flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-wood-dk bg-wood font-serif text-[13px] font-medium italic text-panel shadow-[0_4px_10px_-4px_rgba(36,31,26,.5)]"
        >
          vs
        </span>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">{error}</p>
      )}
    </div>
  )
}
