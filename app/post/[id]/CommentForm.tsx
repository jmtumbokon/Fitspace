'use client'

import { useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { addComment, type CommentState } from '@/app/actions/comments'

const initialState: CommentState = { error: null }

function PostButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 text-sm font-semibold text-rust disabled:opacity-50"
    >
      {pending ? 'Posting…' : 'Post'}
    </button>
  )
}

export default function CommentForm({ postId }: { postId: string }) {
  const formRef = useRef<HTMLFormElement>(null)

  const [state, formAction] = useFormState(
    async (prev: CommentState, formData: FormData) => {
      const result = await addComment(prev, formData)
      if (!result.error) {
        formRef.current?.reset()
      }
      return result
    },
    initialState
  )

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-pill border border-line bg-panel px-4 py-2.5 focus-within:border-ink">
        <input type="hidden" name="post_id" value={postId} />
        <input
          name="body"
          type="text"
          required
          maxLength={1000}
          placeholder="Add a comment…"
          autoComplete="off"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/60"
        />
        <PostButton />
      </div>
      {state.error && (
        <p className="rounded-drawer bg-rust/10 px-3 py-2 text-sm text-rust">{state.error}</p>
      )}
    </form>
  )
}
