'use client'

import { useState, useTransition } from 'react'
import { submitReport } from '@/app/actions/reports'

// Report trigger + inline reason form (closet design language). Pass postId
// to report a post; pass commentId (with postId for context) to report a
// comment. `compact` renders the smaller trigger used in comment meta rows.

type Status = 'idle' | 'sent' | 'already'

export default function ReportAction({
  postId,
  commentId,
  compact = false,
}: {
  postId?: string
  commentId?: string
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const send = () => {
    setError(null)
    startTransition(async () => {
      const result = await submitReport({ postId, commentId, reason })
      if (result.error) {
        setError(result.error)
      } else {
        setStatus(result.already ? 'already' : 'sent')
      }
    })
  }

  if (status !== 'idle') {
    return (
      <p className="mt-1 inline-block rounded-lg bg-sage/10 px-3 py-[6px] text-[12.5px] font-medium text-sage">
        {status === 'sent'
          ? 'Reported — thanks for keeping the closet tidy.'
          : 'You’ve already reported this — it’s on our list.'}
      </p>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={
          compact
            ? 'text-xs text-neutral-400 hover:text-rust hover:underline'
            : 'flex items-center gap-[6px] text-[12.5px] font-medium text-ink-soft transition-colors duration-[220ms] hover:text-rust'
        }
      >
        {!compact && (
          <svg
            className="h-[15px] w-[15px] fill-none stroke-current"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
            />
          </svg>
        )}
        Report
      </button>

      {open && (
        <div className="mt-2 max-w-[420px] rounded-card border border-line bg-panel p-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="What’s wrong? (spam, stolen photo, harassment…)"
            className="w-full resize-none rounded-[10px] border border-line bg-transparent px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-soft/60 focus:border-ink"
          />
          {error && (
            <p className="mt-2 rounded-lg bg-rust/10 px-3 py-2 text-[12.5px] text-rust">{error}</p>
          )}
          <div className="mt-2 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[12.5px] font-medium text-ink-soft transition-colors hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={send}
              disabled={pending || !reason.trim()}
              className="rounded-pill bg-ink px-4 py-[7px] text-[12.5px] font-semibold text-bg transition-colors duration-[250ms] hover:bg-rust disabled:opacity-50"
            >
              {pending ? 'Sending…' : 'Send report'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
