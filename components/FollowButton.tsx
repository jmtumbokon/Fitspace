'use client'

import { useState, useTransition } from 'react'
import { followUser, unfollowUser } from '@/app/actions/interactions'

// Follow/unfollow toggle (closet design language). Optimistic flip,
// reverted on error. The follower count is server-rendered and refreshes
// on the next load (the count trigger keeps the canonical value).

export default function FollowButton({
  targetUserId,
  initialFollowing,
}: {
  targetUserId: string
  initialFollowing: boolean
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const toggle = () => {
    const next = !following
    setError(null)
    setFollowing(next)
    startTransition(async () => {
      const { error } = next ? await followUser(targetUserId) : await unfollowUser(targetUserId)
      if (error) {
        setFollowing(!next)
        setError(error)
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={following}
        className={`group shrink-0 rounded-pill px-5 py-2 text-[13px] font-semibold transition-colors duration-[250ms] disabled:opacity-60 ${
          following
            ? 'border border-line bg-panel text-ink hover:border-rust hover:text-rust'
            : 'bg-ink text-bg hover:bg-rust'
        }`}
      >
        {following ? (
          <>
            <span className="group-hover:hidden">Following</span>
            <span className="hidden group-hover:inline">Unfollow</span>
          </>
        ) : (
          'Follow'
        )}
      </button>
      {error && <span className="text-[11.5px] text-rust">{error}</span>}
    </div>
  )
}
