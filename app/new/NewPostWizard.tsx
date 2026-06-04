'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser'
import { publishPost } from '@/app/actions/posts'

// ─── Tag presets ─────────────────────────────────────────────────────────────

const EVENT_TAGS = [
  'date night', 'brunch', 'beach', 'gym', 'wedding guest',
  'job interview', 'first day of work', 'black tie', 'picnic',
  'concert', 'festival', 'casual friday', 'birthday party',
  'rooftop dinner', 'club', 'coffee date', 'travel',
]

const STYLE_TAGS = [
  'streetwear', 'minimalist', 'cottagecore', 'dark academia',
  'preppy', 'Y2K', 'vintage', 'athleisure', 'boho', 'old money',
  'grunge', 'techwear', 'business casual', 'maximalist', 'coastal',
]

const AESTHETIC_TAGS = [
  'clean', 'bold', 'colorful', 'monochrome', 'edgy',
  'feminine', 'casual', 'formal', 'artsy', 'classic',
  'playful', 'moody', 'romantic', 'sporty',
]

// ─── Types ───────────────────────────────────────────────────────────────────

type Pin = {
  id: string
  x: number       // % from left
  y: number       // % from top
  label: string
  brand: string
  item_name: string
  price: string
  purchase_url: string
}

type Step = 1 | 2 | 3 | 4

// ─── Shared sub-components ───────────────────────────────────────────────────

function StepBar({ step }: { step: Step }) {
  const labels = ['Photo', 'Tag items', 'Details', 'Review']
  return (
    <div className="flex items-center gap-0 mb-8">
      {labels.map((label, i) => {
        const n = i + 1 as Step
        const done = n < step
        const active = n === step
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done || active ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                {done ? '✓' : n}
              </div>
              <span className={`text-[10px] mt-1 whitespace-nowrap ${active ? 'text-neutral-900 font-medium' : 'text-neutral-400'}`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-3 transition-colors ${done ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function TagPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (tags: string[]) => void
}) {
  function toggle(tag: string) {
    onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag])
  }
  return (
    <div>
      <p className="text-sm font-medium text-neutral-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            className={`text-xs rounded-full px-3 py-1.5 transition-colors ${
              selected.includes(tag)
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  )
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
}: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
}) {
  return (
    <div className="flex items-center gap-3 mt-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
        >
          Back
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="flex-1 rounded-xl bg-neutral-900 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-40 transition"
      >
        {nextLabel}
      </button>
    </div>
  )
}

// ─── Main Wizard ─────────────────────────────────────────────────────────────

export default function NewPostWizard() {
  const [step, setStep] = useState<Step>(1)

  // Step 1
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Step 2
  const [pins, setPins] = useState<Pin[]>([])
  const [activePinId, setActivePinId] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Step 3
  const [caption, setCaption] = useState('')
  const [eventTags, setEventTags] = useState<string[]>([])
  const [styleTags, setStyleTags] = useState<string[]>([])
  const [aestheticTags, setAestheticTags] = useState<string[]>([])

  // Step 4
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  // ── Step 1: Photo selection ─────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPhotoFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  // ── Step 2: Pin placement ───────────────────────────────────────────────

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Don't create a new pin if clicking an existing one
      if ((e.target as HTMLElement).closest('[data-pin]')) return

      const img = imgRef.current
      if (!img) return
      const rect = img.getBoundingClientRect()
      const x = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(2))
      const y = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(2))

      const newPin: Pin = {
        id: crypto.randomUUID(),
        x, y,
        label: '', brand: '', item_name: '', price: '', purchase_url: '',
      }
      setPins((prev) => [...prev, newPin])
      setActivePinId(newPin.id)
    },
    []
  )

  function updatePin(id: string, field: keyof Omit<Pin, 'id' | 'x' | 'y'>, value: string) {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  function removePin(id: string) {
    setPins((prev) => prev.filter((p) => p.id !== id))
    if (activePinId === id) setActivePinId(null)
  }

  const activePin = pins.find((p) => p.id === activePinId) ?? null

  // ── Step 4: Publish ─────────────────────────────────────────────────────

  async function handlePublish() {
    if (!photoFile) return
    setPublishing(true)
    setPublishError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload image to Supabase Storage
      const ext = photoFile.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('outfit-photos')
        .upload(path, photoFile, { contentType: photoFile.type, upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('outfit-photos')
        .getPublicUrl(path)

      // Insert post + items via Server Action
      await publishPost({
        imageUrl: publicUrl,
        caption,
        eventTags,
        styleTags,
        aestheticTags,
        items: pins.map((pin) => ({
          label: pin.label,
          brand: pin.brand,
          item_name: pin.item_name,
          price: pin.price ? parseFloat(pin.price) : null,
          purchase_url: pin.purchase_url || null,
          position_x: pin.x,
          position_y: pin.y,
        })),
      })
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setPublishing(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/feed" className="text-sm text-neutral-500 hover:text-neutral-900 transition">
          ✕ Cancel
        </Link>
        <span className="text-base font-bold">New fit</span>
        <div className="w-14" />
      </div>

      <StepBar step={step} />

      {/* ── Step 1: Upload ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <label
            htmlFor="photo-upload"
            className={`flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed transition cursor-pointer
              ${previewUrl ? 'border-neutral-300 p-0 overflow-hidden' : 'border-neutral-300 hover:border-neutral-400 bg-white p-12'}`}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="w-full h-auto block rounded-2xl" />
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-neutral-700">Tap to upload your fit</p>
                <p className="text-xs text-neutral-400 mt-1">JPG, PNG, WEBP</p>
              </>
            )}
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>

          {previewUrl && (
            <label
              htmlFor="photo-upload"
              className="block text-center text-xs text-neutral-500 hover:text-neutral-800 mt-3 cursor-pointer transition"
            >
              Change photo
            </label>
          )}

          <NavButtons
            onNext={() => setStep(2)}
            nextDisabled={!previewUrl}
          />
        </div>
      )}

      {/* ── Step 2: Pin outfit items ───────────────────────────────────── */}
      {step === 2 && previewUrl && (
        <div>
          <p className="text-xs text-neutral-500 text-center mb-3">
            Tap anywhere on the photo to tag an item
          </p>

          {/* Photo with pins */}
          <div
            className="relative rounded-2xl overflow-hidden cursor-crosshair select-none bg-neutral-100"
            onClick={handleImageClick}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={previewUrl}
              alt="Your outfit"
              className="w-full h-auto block"
              draggable={false}
            />

            {/* Pin markers */}
            {pins.map((pin, i) => (
              <button
                key={pin.id}
                data-pin
                type="button"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                onClick={(e) => { e.stopPropagation(); setActivePinId(pin.id) }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white text-[10px] font-bold flex items-center justify-center shadow-md transition-transform hover:scale-110 z-10 ${
                  activePinId === pin.id ? 'bg-blue-500' : 'bg-neutral-900'
                } text-white`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Active pin form */}
          {activePin && (
            <div className="mt-4 bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-neutral-900">
                  Item {pins.findIndex((p) => p.id === activePin.id) + 1}
                </p>
                <button
                  type="button"
                  onClick={() => setActivePinId(null)}
                  className="text-xs text-neutral-400 hover:text-neutral-700 transition"
                >
                  Done
                </button>
              </div>

              {(
                [
                  { field: 'label' as const, label: 'Type (e.g. Jacket, Shoes)', placeholder: 'Jacket' },
                  { field: 'brand' as const, label: 'Brand', placeholder: 'Nike' },
                  { field: 'item_name' as const, label: 'Item name', placeholder: 'Air Force 1' },
                ] as const
              ).map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">{label}</label>
                  <input
                    type="text"
                    value={activePin[field]}
                    onChange={(e) => updatePin(activePin.id, field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Price (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={activePin.price}
                    onChange={(e) => updatePin(activePin.id, 'price', e.target.value)}
                    placeholder="120"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Buy link</label>
                  <input
                    type="url"
                    value={activePin.purchase_url}
                    onChange={(e) => updatePin(activePin.id, 'purchase_url', e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => removePin(activePin.id)}
                className="text-xs text-red-500 hover:text-red-700 transition"
              >
                Remove this pin
              </button>
            </div>
          )}

          {/* Pinned items list */}
          {pins.length > 0 && !activePin && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-neutral-500">{pins.length} item{pins.length !== 1 ? 's' : ''} tagged</p>
              {pins.map((pin, i) => (
                <div
                  key={pin.id}
                  className="flex items-center gap-3 bg-white border border-neutral-200 rounded-xl px-3 py-2.5"
                >
                  <div className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-neutral-700 flex-1 truncate">
                    {pin.item_name || pin.label || <span className="text-neutral-400 italic">Unnamed item</span>}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActivePinId(pin.id)}
                    className="text-xs text-neutral-500 hover:text-neutral-900 transition"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}

          <NavButtons
            onBack={() => setStep(1)}
            onNext={() => { setActivePinId(null); setStep(3) }}
            nextLabel={pins.length === 0 ? 'Skip' : 'Next'}
          />
        </div>
      )}

      {/* ── Step 3: Details ────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Caption <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe your fit…"
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition resize-none"
            />
            <p className="text-right text-xs text-neutral-400 mt-1">{caption.length}/500</p>
          </div>

          <TagPicker label="Event" options={EVENT_TAGS} selected={eventTags} onChange={setEventTags} />
          <TagPicker label="Style" options={STYLE_TAGS} selected={styleTags} onChange={setStyleTags} />
          <TagPicker label="Aesthetic" options={AESTHETIC_TAGS} selected={aestheticTags} onChange={setAestheticTags} />

          <NavButtons onBack={() => setStep(2)} onNext={() => setStep(4)} />
        </div>
      )}

      {/* ── Step 4: Review & Publish ───────────────────────────────────── */}
      {step === 4 && previewUrl && (
        <div className="space-y-4">
          {/* Photo thumbnail */}
          <div className="rounded-2xl overflow-hidden bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Your outfit" className="w-full h-auto block" />
          </div>

          {/* Caption */}
          {caption && (
            <p className="text-sm text-neutral-700 leading-relaxed">{caption}</p>
          )}

          {/* Tags */}
          {(eventTags.length > 0 || styleTags.length > 0 || aestheticTags.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {eventTags.map((t) => (
                <span key={t} className="text-xs bg-neutral-100 text-neutral-600 rounded-full px-2.5 py-1">{t}</span>
              ))}
              {styleTags.map((t) => (
                <span key={t} className="text-xs bg-neutral-900 text-white rounded-full px-2.5 py-1">{t}</span>
              ))}
              {aestheticTags.map((t) => (
                <span key={t} className="text-xs border border-neutral-300 text-neutral-600 rounded-full px-2.5 py-1">{t}</span>
              ))}
            </div>
          )}

          {/* Outfit items */}
          {pins.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                {pins.length} outfit item{pins.length !== 1 ? 's' : ''}
              </p>
              {pins.map((pin, i) => (
                <div key={pin.id} className="flex items-center gap-3 bg-white border border-neutral-200 rounded-xl px-4 py-3">
                  <div className="w-5 h-5 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">
                      {pin.item_name || pin.label || 'Item'}
                    </p>
                    {pin.brand && <p className="text-xs text-neutral-400">{pin.brand}</p>}
                  </div>
                  {pin.price && (
                    <span className="text-sm font-semibold text-neutral-800 shrink-0">
                      ${parseFloat(pin.price).toFixed(0)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {publishError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {publishError}
            </div>
          )}

          <NavButtons
            onBack={() => setStep(3)}
            onNext={handlePublish}
            nextLabel={publishing ? 'Publishing…' : 'Publish fit'}
            nextDisabled={publishing}
          />
        </div>
      )}
    </div>
  )
}
