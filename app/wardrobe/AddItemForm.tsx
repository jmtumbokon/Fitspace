'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { addWardrobeItem } from '@/app/actions/wardrobe'
import { createClient } from '@/lib/supabase/client'
import { OUTFITS_BUCKET, WARDROBE_CATEGORIES } from '@/lib/constants'

const inputClass =
  'w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-ink'

export default function AddItemForm({
  userId,
  onDone,
}: {
  userId: string
  onDone: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [label, setLabel] = useState('')
  const [brand, setBrand] = useState('')
  const [itemName, setItemName] = useState('')
  const [price, setPrice] = useState('')
  const [datePurchased, setDatePurchased] = useState('')
  const [category, setCategory] = useState('')
  const [colorTags, setColorTags] = useState('')
  const [isWishlist, setIsWishlist] = useState(false)
  const [wishlistUrl, setWishlistUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const busy = uploading || isPending

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setUploading(true)

    try {
      let imageUrl: string | null = null
      if (file) {
        const supabase = createClient()
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        // RLS requires the path to start with {userId}/
        const path = `${userId}/wardrobe/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from(OUTFITS_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false })
        if (uploadError) throw new Error(uploadError.message)
        imageUrl = supabase.storage.from(OUTFITS_BUCKET).getPublicUrl(path).data.publicUrl
      }

      const parsedPrice = parseFloat(price)
      startTransition(async () => {
        const { error } = await addWardrobeItem({
          imageUrl,
          label,
          brand,
          item_name: itemName,
          price: Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : null,
          date_purchased: datePurchased || null,
          category: category || null,
          color_tags: colorTags
            .split(',')
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean),
          is_wishlist: isWishlist,
          wishlist_url: wishlistUrl,
        })
        if (error) {
          setError(error)
        } else {
          onDone()
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card border border-line bg-panel p-5"
    >
      <div className="flex gap-4">
        {/* Photo */}
        <label className="relative block h-[104px] w-[88px] shrink-0 cursor-pointer overflow-hidden rounded-[10px] border-2 border-dashed border-line text-ink-soft hover:border-ink-soft">
          {preview ? (
            <Image src={preview} alt="Item preview" fill className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full flex-col items-center justify-center gap-1 text-center">
              <span className="text-xl leading-none">+</span>
              <span className="text-[10px]">photo</span>
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
          <input type="text" placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
          <input type="text" placeholder="Item name" value={itemName} onChange={(e) => setItemName(e.target.value)} className={inputClass} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option value="">Category…</option>
            {WARDROBE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder={isWishlist ? 'Price ($, listed)' : 'Price ($)'}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <input type="text" placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} />
        <input type="text" placeholder="Colors (comma-separated)" value={colorTags} onChange={(e) => setColorTags(e.target.value)} className={inputClass} />
        {isWishlist ? (
          <input type="url" placeholder="Wishlist link" value={wishlistUrl} onChange={(e) => setWishlistUrl(e.target.value)} className={`${inputClass} col-span-2`} />
        ) : (
          <label className="col-span-2 flex items-center gap-2 text-xs text-ink-soft">
            <span className="shrink-0">Date purchased</span>
            <input type="date" value={datePurchased} onChange={(e) => setDatePurchased(e.target.value)} className={inputClass} />
          </label>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={isWishlist}
            onChange={(e) => setIsWishlist(e.target.checked)}
            className="h-4 w-4 accent-ink"
          />
          Wishlist item (don&apos;t own it yet)
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-pill bg-ink px-5 py-2 text-sm font-semibold text-bg transition-colors duration-[250ms] hover:bg-rust disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : isPending ? 'Saving…' : 'Add to closet'}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">{error}</p>
      )}
    </form>
  )
}
