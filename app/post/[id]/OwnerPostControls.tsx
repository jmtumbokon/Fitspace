'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { deletePost, updatePost } from '@/app/actions/posts'
import Chip from '@/components/Chip'
import { SEASONS, STYLE_PERSONAS } from '@/lib/constants'

const inputClass =
  'w-full rounded-drawer border border-line bg-panel px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-[220ms] focus:border-ink placeholder:text-ink-soft/55'
const labelClass = 'mb-1 block text-[13.5px] font-medium text-ink'

export type EditablePost = {
  caption: string
  styleTags: string[]
  eventTags: string[]
  season: string
  ratingsEnabled: boolean
}

export default function OwnerPostControls({
  postId,
  initial,
}: {
  postId: string
  initial: EditablePost
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'idle' | 'edit' | 'confirmDelete'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Edit form state
  const [caption, setCaption] = useState(initial.caption)
  const [styleTags, setStyleTags] = useState<string[]>(initial.styleTags)
  const [eventTags, setEventTags] = useState(initial.eventTags.join(', '))
  const [season, setSeason] = useState(initial.season)
  const [ratingsEnabled, setRatingsEnabled] = useState(initial.ratingsEnabled)

  const toggleStyle = (tag: string) =>
    setStyleTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

  const save = () => {
    setError(null)
    startTransition(async () => {
      const { error } = await updatePost(postId, {
        caption,
        styleTags,
        eventTags: eventTags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        season: season || null,
        ratingsEnabled,
      })
      if (error) {
        setError(error)
      } else {
        setMode('idle')
        router.refresh()
      }
    })
  }

  const remove = () => {
    setError(null)
    // deletePost redirects to /feed on success
    startTransition(async () => {
      const result = await deletePost(postId)
      if (result?.error) setError(result.error)
    })
  }

  // Reset edit fields to the latest server values when (re)opening
  const openEdit = () => {
    setCaption(initial.caption)
    setStyleTags(initial.styleTags)
    setEventTags(initial.eventTags.join(', '))
    setSeason(initial.season)
    setRatingsEnabled(initial.ratingsEnabled)
    setError(null)
    setMode('edit')
  }

  if (mode === 'edit') {
    return (
      <div className="mt-3 rounded-card border border-line bg-panel p-4">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[2px] text-rust">
          Edit fit
        </div>

        <label htmlFor="edit-caption" className={labelClass}>
          Caption
        </label>
        <textarea
          id="edit-caption"
          rows={3}
          maxLength={2200}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Tell the story of this fit…"
          className={`${inputClass} resize-none`}
        />

        <div className="mt-4 text-[13.5px] font-medium text-ink">Style</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {STYLE_PERSONAS.map((tag) => (
            <Chip key={tag} on={styleTags.includes(tag)} onClick={() => toggleStyle(tag)}>
              {tag}
            </Chip>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-occasion" className={labelClass}>
              Occasion <span className="font-normal text-ink-soft">(comma-separated)</span>
            </label>
            <input
              id="edit-occasion"
              type="text"
              value={eventTags}
              onChange={(e) => setEventTags(e.target.value)}
              placeholder="date night, concert"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="edit-season" className={labelClass}>
              Season
            </label>
            <select
              id="edit-season"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className={inputClass}
            >
              <option value="">Any season</option>
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={ratingsEnabled}
            onChange={(e) => setRatingsEnabled(e.target.checked)}
            className="h-4 w-4 accent-ink"
          />
          Let people rate this fit
        </label>

        {error && <p className="mt-3 rounded-drawer bg-rust/10 px-3 py-2 text-sm text-rust">{error}</p>}

        <div className="mt-4 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => setMode('idle')}
            className="text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-pill bg-ink px-5 py-[9px] text-[13px] font-semibold text-bg transition-colors duration-[250ms] hover:bg-rust disabled:opacity-60"
          >
            {pending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'confirmDelete') {
    return (
      <div className="mt-3 rounded-card border border-line bg-panel p-4">
        <p className="text-sm text-ink">
          Delete this fit? This removes it for everyone, along with its likes, comments, and
          ratings. This can’t be undone.
        </p>
        {error && <p className="mt-3 rounded-drawer bg-rust/10 px-3 py-2 text-sm text-rust">{error}</p>}
        <div className="mt-4 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => setMode('idle')}
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
      <button
        type="button"
        onClick={openEdit}
        className="text-[12.5px] font-medium text-ink-soft transition-colors duration-[220ms] hover:text-ink"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => {
          setError(null)
          setMode('confirmDelete')
        }}
        className="text-[12.5px] font-medium text-ink-soft transition-colors duration-[220ms] hover:text-rust"
      >
        Delete
      </button>
    </div>
  )
}
