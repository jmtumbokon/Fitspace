'use client'

import { useState, useTransition } from 'react'
import { toggleLike } from '@/app/actions/interactions'

export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: {
  postId: string
  initialLiked: boolean
  initialCount: number
}) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  function handleLike() {
    const prevLiked = liked
    const prevCount = count

    // Optimistic update
    setLiked(!prevLiked)
    setCount(prevLiked ? prevCount - 1 : prevCount + 1)

    startTransition(async () => {
      try {
        await toggleLike(postId)
      } catch {
        // Revert on error
        setLiked(prevLiked)
        setCount(prevCount)
      }
    })
  }

  return (
    <button
      onClick={handleLike}
      disabled={isPending}
      aria-label={liked ? 'Unlike' : 'Like'}
      className={`flex items-center gap-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
        liked ? 'text-red-500' : 'text-neutral-500 hover:text-red-400'
      }`}
    >
      <HeartIcon filled={liked} />
      {count}
    </button>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-all"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}
