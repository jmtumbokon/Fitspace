'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { deletePost } from '@/app/actions/posts'

// Owner-only controls on the post detail page: Edit links to the full edit
// page; Delete confirms inline before removing (deletePost redirects to /feed).
export default function OwnerPostControls({ postId }: { postId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const remove = () => {
    setError(null)
    startTransition(async () => {
      const result = await deletePost(postId)
      if (result?.error) setError(result.error)
    })
  }

  if (confirming) {
    return (
      <div className="mt-3 rounded-card border border-line bg-panel p-4">
        <p className="text-sm text-ink">
          Delete this fit? This removes it for everyone, along with its likes, comments, and
          ratings. This can’t be undone.
        </p>
        {error && (
          <p className="mt-3 rounded-drawer bg-rust/10 px-3 py-2 text-sm text-rust">{error}</p>
        )}
        <div className="mt-4 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="rounded-pill bg-rust px-5 py-[9px] text-[13px] font-semibold text-bg transition-opacity duration-[250ms] hover:opacity-90 disabled:opacity-60"
          >
            {pending ? 'Deleting…' : 'Delete fit'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2 flex items-center gap-4">
      <Link
        href={`/post/${postId}/edit`}
        className="text-[12.5px] font-medium text-ink-soft transition-colors duration-[220ms] hover:text-ink"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={() => {
          setError(null)
          setConfirming(true)
        }}
        className="text-[12.5px] font-medium text-ink-soft transition-colors duration-[220ms] hover:text-rust"
      >
        Delete
      </button>
    </div>
  )
}
