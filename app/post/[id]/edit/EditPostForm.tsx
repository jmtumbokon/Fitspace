'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { updatePost, type NewOutfitItem } from '@/app/actions/posts'
import Chip from '@/components/Chip'
import { createClient } from '@/lib/supabase/client'
import { MAX_POST_IMAGES, OUTFITS_BUCKET, SEASONS, STYLE_PERSONAS } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'

const inputClass =
  'w-full rounded-drawer border border-line bg-panel px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-[220ms] focus:border-ink placeholder:text-ink-soft/55'
const labelClass = 'mb-1 block text-[13.5px] font-medium text-ink'
const optionalClass = 'font-normal text-ink-soft'

type ItemRow = { brand: string; item_name: string; price: string; purchase_url: string }
const emptyItem: ItemRow = { brand: '', item_name: '', price: '', purchase_url: '' }

// A photo is either an already-uploaded URL or a freshly picked File.
type Photo = { key: string; url?: string; file?: File }

export type EditInitial = {
  imageUrls: string[]
  caption: string
  styleTags: string[]
  eventTags: string[]
  season: string
  ratingsEnabled: boolean
  items: { brand: string; item_name: string; price: number | null; purchase_url: string }[]
}

export default function EditPostForm({
  postId,
  userId,
  initial,
}: {
  postId: string
  userId: string
  initial: EditInitial
}) {
  const [photos, setPhotos] = useState<Photo[]>(
    initial.imageUrls.map((url, i) => ({ key: `existing-${i}-${url}`, url }))
  )
  const [caption, setCaption] = useState(initial.caption)
  const [styleTags, setStyleTags] = useState<string[]>(initial.styleTags)
  const [eventTags, setEventTags] = useState(initial.eventTags.join(', '))
  const [season, setSeason] = useState(initial.season)
  const [ratingsEnabled, setRatingsEnabled] = useState(initial.ratingsEnabled)
  const [items, setItems] = useState<ItemRow[]>(
    initial.items.map((it) => ({
      brand: it.brand,
      item_name: it.item_name,
      price: it.price != null ? String(it.price) : '',
      purchase_url: it.purchase_url,
    }))
  )
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const busy = uploading || isPending

  // Object URLs for the freshly picked files (revoked on change/unmount)
  const previews = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of photos) if (p.file) map.set(p.key, URL.createObjectURL(p.file))
    return map
  }, [photos])
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url))
  }, [previews])

  const totalCost = items.reduce((sum, item) => {
    const price = parseFloat(item.price)
    return sum + (Number.isFinite(price) ? price : 0)
  }, 0)

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const picked = Array.from(incoming)
      .filter((file) => file.type.startsWith('image/'))
      .map((file, i) => ({ key: `new-${Date.now()}-${i}`, file }))
    setPhotos((prev) => [...prev, ...picked].slice(0, MAX_POST_IMAGES))
  }

  const toggleStyleTag = (tag: string) =>
    setStyleTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

  const updateItem = (index: number, patch: Partial<ItemRow>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (photos.length === 0) {
      setError('Keep at least one photo of your fit.')
      return
    }
    setError(null)
    setUploading(true)

    try {
      const supabase = createClient()
      // Build the final ordered URL list, uploading any new files
      const imageUrls: string[] = []
      for (const photo of photos) {
        if (photo.url) {
          imageUrls.push(photo.url)
          continue
        }
        const file = photo.file!
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${userId}/${Date.now()}-${imageUrls.length}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from(OUTFITS_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false })
        if (uploadError) throw new Error(uploadError.message)
        imageUrls.push(supabase.storage.from(OUTFITS_BUCKET).getPublicUrl(path).data.publicUrl)
      }

      const parsedItems: NewOutfitItem[] = items.map((item) => {
        const price = parseFloat(item.price)
        return {
          brand: item.brand,
          item_name: item.item_name,
          price: Number.isFinite(price) && price >= 0 ? price : null,
          purchase_url: item.purchase_url,
        }
      })

      startTransition(async () => {
        const result = await updatePost(postId, {
          imageUrls,
          caption,
          styleTags,
          eventTags: eventTags
            .split(',')
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean),
          season: season || null,
          ratingsEnabled,
          items: parsedItems,
        })
        // updatePost redirects to the post on success; a return means failure
        if (result?.error) setError(result.error)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Photos */}
      <div>
        <span className="mb-2 block text-[13.5px] font-medium text-ink">Photos</span>
        <div className="grid grid-cols-4 gap-2">
          {photos.map((photo, index) => {
            const src = photo.url ?? previews.get(photo.key)
            return (
              <div
                key={photo.key}
                className="relative aspect-[4/5] overflow-hidden rounded-[10px] border border-line-soft bg-bg2"
              >
                {src && (
                  <Image src={src} alt={`Photo ${index + 1}`} fill className="object-cover" unoptimized />
                )}
                {index === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-ink/70 px-1.5 py-0.5 text-[10px] font-medium text-bg">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                  aria-label={`Remove photo ${index + 1}`}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs text-bg transition-colors hover:bg-rust"
                >
                  ×
                </button>
              </div>
            )
          })}
          {photos.length < MAX_POST_IMAGES && (
            <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border-2 border-dashed border-line text-ink-soft transition-colors hover:border-ink-soft hover:text-ink">
              <span className="text-2xl leading-none">+</span>
              <span className="text-xs">Add</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </label>
          )}
        </div>
        <p className="mt-1 text-xs text-ink-soft">
          Up to {MAX_POST_IMAGES} photos. The first one is your cover.
        </p>
      </div>

      {/* Caption */}
      <div>
        <label htmlFor="caption" className={labelClass}>
          Caption
        </label>
        <textarea
          id="caption"
          rows={3}
          maxLength={2200}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Tell the story of this fit…"
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Style tags */}
      <fieldset>
        <legend className="mb-2 text-[13.5px] font-medium text-ink">Style</legend>
        <div className="flex flex-wrap gap-2">
          {STYLE_PERSONAS.map((tag) => (
            <Chip key={tag} on={styleTags.includes(tag)} onClick={() => toggleStyleTag(tag)}>
              {tag}
            </Chip>
          ))}
        </div>
      </fieldset>

      {/* Event tags + season */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="event_tags" className={labelClass}>
            Occasion <span className={optionalClass}>(comma-separated)</span>
          </label>
          <input
            id="event_tags"
            type="text"
            value={eventTags}
            onChange={(e) => setEventTags(e.target.value)}
            placeholder="date night, concert"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="season" className={labelClass}>
            Season <span className={optionalClass}>(optional)</span>
          </label>
          <select
            id="season"
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

      {/* Outfit items */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13.5px] font-medium text-ink">
            Outfit items <span className={optionalClass}>(optional)</span>
          </span>
          {totalCost > 0 && (
            <span className="text-xs font-semibold text-rust">Total: {formatPrice(totalCost)}</span>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-drawer border border-line bg-panel p-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Brand"
                  value={item.brand}
                  onChange={(e) => updateItem(index, { brand: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Item name"
                  value={item.item_name}
                  onChange={(e) => updateItem(index, { item_name: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price ($)"
                  value={item.price}
                  onChange={(e) => updateItem(index, { price: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="url"
                  placeholder="Link (optional)"
                  value={item.purchase_url}
                  onChange={(e) => updateItem(index, { purchase_url: e.target.value })}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                className="mt-2 text-xs font-medium text-rust hover:underline"
              >
                Remove item
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { ...emptyItem }])}
            className="rounded-drawer border border-dashed border-line py-2 text-sm text-ink-soft transition-colors hover:border-ink-soft hover:text-ink"
          >
            + Add item
          </button>
        </div>
      </div>

      {/* Ratings toggle */}
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={ratingsEnabled}
          onChange={(e) => setRatingsEnabled(e.target.checked)}
          className="h-4 w-4 accent-ink"
        />
        Let people rate this fit
      </label>

      {error && <p className="rounded-drawer bg-rust/10 px-3 py-2 text-sm text-rust">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="rounded-pill bg-ink px-6 py-3 text-sm font-semibold text-bg transition-colors duration-[250ms] hover:bg-rust disabled:opacity-60"
        >
          {uploading ? 'Uploading photos…' : isPending ? 'Saving…' : 'Save changes'}
        </button>
        <Link
          href={`/post/${postId}`}
          className="text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
