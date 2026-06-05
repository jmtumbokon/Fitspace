'use client'

import { useState, useTransition } from 'react'
import { savePost, unsavePost } from '@/app/actions/interactions'

export default function SaveButton({
  postId,
  initialSaved,
}: {
  postId: string
  initialSaved: boolean
}) {
  const [saved, setSaved] = useState(initialSaved)
  const [, startTransition] = useTransition()

  const toggle = () => {
    const next = !saved
    setSaved(next)
    startTransition(async () => {
      const { error } = next ? await savePost(postId) : await unsavePost(postId)
      if (error) {
        setSaved(!next)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? 'Unsave' : 'Save'}
    >
      <svg
        className={`h-6 w-6 transition-colors ${saved ? 'fill-black stroke-black' : 'fill-none stroke-current'}`}
        viewBox="0 0 24 24"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c.1.128.157.286.157.45v16.478a.75.75 0 01-1.185.61L12 17.21l-4.565 3.65a.75.75 0 01-1.185-.61V3.772c0-.164.057-.322.157-.45A2.25 2.25 0 018.25 2.5h7.5a2.25 2.25 0 011.843.822z"
        />
      </svg>
    </button>
  )
}
