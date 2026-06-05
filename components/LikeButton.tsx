'use client'

import { useState, useTransition } from 'react'
import { likePost, unlikePost } from '@/app/actions/interactions'

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
  const [, startTransition] = useTransition()

  const toggle = () => {
    const next = !liked
    // Optimistic flip; revert if the action fails
    setLiked(next)
    setCount((c) => c + (next ? 1 : -1))
    startTransition(async () => {
      const { error } = next ? await likePost(postId) : await unlikePost(postId)
      if (error) {
        setLiked(!next)
        setCount((c) => c - (next ? 1 : -1))
      }
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike' : 'Like'}
      className="flex items-center gap-1.5 text-sm"
    >
      <svg
        className={`h-6 w-6 transition-colors ${liked ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-current'}`}
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      <span className="tabular-nums">{count > 0 ? count : ''}</span>
    </button>
  )
}
