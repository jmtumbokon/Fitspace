'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { addComment } from '@/app/actions/interactions'

export type CommentData = {
  id: string
  body: string
  created_at: string
  profile: { username: string; avatar_url: string | null } | null
}

export type CurrentUser = {
  id: string
  username: string
  avatar_url: string | null
} | null

export default function CommentsSection({
  postId,
  initialComments,
  currentUser,
}: {
  postId: string
  initialComments: CommentData[]
  currentUser: CurrentUser
}) {
  const [comments, setComments] = useState<CommentData[]>(initialComments)
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function submitComment() {
    const trimmed = body.trim()
    if (!trimmed || !currentUser || isPending) return

    const tempId = `temp-${Date.now()}`
    const optimistic: CommentData = {
      id: tempId,
      body: trimmed,
      created_at: new Date().toISOString(),
      profile: { username: currentUser.username, avatar_url: currentUser.avatar_url },
    }

    setBody('')
    setComments((prev) => [...prev, optimistic])

    startTransition(async () => {
      try {
        const result = await addComment(postId, trimmed)
        setComments((prev) =>
          prev.map((c) =>
            c.id === tempId ? { ...c, id: result.id, created_at: result.created_at } : c
          )
        )
      } catch {
        // Remove optimistic comment, restore text
        setComments((prev) => prev.filter((c) => c.id !== tempId))
        setBody(trimmed)
        textareaRef.current?.focus()
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      submitComment()
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-neutral-800">
        {comments.length === 0
          ? 'No comments'
          : `${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
      </h2>

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-neutral-200 overflow-hidden shrink-0 mt-0.5">
                {comment.profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={comment.profile.avatar_url}
                    alt={comment.profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-600 uppercase">
                    {comment.profile?.username?.[0] ?? '?'}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-neutral-800 mb-0.5">
                  @{comment.profile?.username ?? 'unknown'}
                </p>
                <p className="text-sm text-neutral-700 leading-relaxed break-words">
                  {comment.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment */}
      <div className="border-t border-neutral-200 pt-4">
        {currentUser ? (
          <div className="flex gap-3 items-start">
            {/* Current user avatar */}
            <div className="w-7 h-7 rounded-full bg-neutral-200 overflow-hidden shrink-0 mt-1">
              {currentUser.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-600 uppercase">
                  {currentUser.username[0]}
                </div>
              )}
            </div>

            <div className="flex-1 flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment… (⌘↵ to post)"
                rows={2}
                maxLength={500}
                className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm resize-none outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
              />
              <button
                type="button"
                onClick={submitComment}
                disabled={!body.trim() || isPending}
                className="rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm font-semibold hover:bg-neutral-700 disabled:opacity-40 transition shrink-0 self-end"
              >
                {isPending ? '…' : 'Post'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-400 text-center">
            <Link href="/login" className="text-neutral-800 font-medium hover:underline">
              Log in
            </Link>{' '}
            to like and comment
          </p>
        )}
      </div>
    </div>
  )
}
