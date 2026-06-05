'use client'

import { useMemo, useState } from 'react'
import Chip from '@/components/Chip'
import ClosetCard, { type Closet } from '@/components/ClosetCard'
import PeekOverlay from '@/components/PeekOverlay'

export default function ClosetWall({
  closets,
  viewerId,
  initialFollowing,
}: {
  closets: Closet[]
  viewerId: string
  initialFollowing: string[]
}) {
  const [filter, setFilter] = useState('all')
  const [following, setFollowing] = useState<Set<string>>(new Set(initialFollowing))
  const [peeked, setPeeked] = useState<Closet | null>(null)

  // Persona filter chips from whoever is actually on the wall
  const personas = useMemo(() => {
    const seen = new Set<string>()
    for (const closet of closets) {
      if (closet.persona) seen.add(closet.persona)
    }
    return Array.from(seen).slice(0, 4)
  }, [closets])

  const visible = closets.filter((closet) => {
    if (filter === 'all') return true
    if (filter === 'following') return following.has(closet.userId)
    return closet.persona === filter
  })

  const onFollowChange = (userId: string, isFollowing: boolean) => {
    setFollowing((prev) => {
      const next = new Set(prev)
      if (isFollowing) {
        next.add(userId)
      } else {
        next.delete(userId)
      }
      return next
    })
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Chip on={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </Chip>
        <Chip on={filter === 'following'} onClick={() => setFilter('following')}>
          Following
        </Chip>
        {personas.map((persona) => (
          <Chip key={persona} on={filter === persona} onClick={() => setFilter(persona)}>
            {persona}
          </Chip>
        ))}
      </div>

      {/* The wall */}
      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-soft">
          {filter === 'following'
            ? 'You aren’t following any closets yet — peek into one and follow it.'
            : 'No closets here yet.'}
        </p>
      ) : (
        <div className="mt-7 grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((closet, i) => (
            <ClosetCard
              key={closet.userId}
              closet={closet}
              index={i}
              onPeek={() => setPeeked(closet)}
            />
          ))}
        </div>
      )}

      <PeekOverlay
        closet={peeked}
        isOwn={peeked?.userId === viewerId}
        isFollowing={peeked ? following.has(peeked.userId) : false}
        onClose={() => setPeeked(null)}
        onFollowChange={onFollowChange}
      />
    </>
  )
}
