'use client'

import { useEffect, useState } from 'react'
import { useFormState } from 'react-dom'
import { completeOnboarding, type AuthState } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { AVATARS_BUCKET, BODY_TYPES, MAX_AVATAR_BYTES, STYLE_PERSONAS } from '@/lib/constants'
import SubmitButton from '@/components/SubmitButton'

const initialState: AuthState = { error: null }

const inputClass =
  'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black'

export default function OnboardingForm({
  userId,
  initialUsername,
  initialPersonas,
  initialAvatarUrl,
}: {
  userId: string
  initialUsername: string
  initialPersonas: string[]
  initialAvatarUrl: string | null
}) {
  const [state, formAction] = useFormState(completeOnboarding, initialState)
  const [personas, setPersonas] = useState<string[]>(initialPersonas)

  // Avatar is uploaded to storage on selection; the resulting public URL
  // rides along in a hidden field and is saved by completeOnboarding.
  // Skippable — left empty, the profile keeps its initial-circle fallback.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  // Revoke the local preview object URL when it changes / unmounts
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const togglePersona = (persona: string) => {
    setPersonas((prev) =>
      prev.includes(persona) ? prev.filter((p) => p !== persona) : [...prev, persona]
    )
  }

  const handleAvatar = async (file: File | undefined) => {
    if (!file) return
    setAvatarError(null)

    if (!file.type.startsWith('image/')) {
      setAvatarError('Pick an image file.')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('That image is over 5MB — pick a smaller one.')
      return
    }

    // Instant local preview while the upload runs
    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)
    setUploading(true)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      // RLS requires the {userId}/... shape; upsert replaces on re-pick
      const path = `${userId}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: true })
      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)
      // Cache-bust so a re-upload to the same path isn't served stale by the CDN
      setAvatarUrl(`${publicUrl}?v=${Date.now()}`)
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Upload failed. Try again.')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const displaySrc = preview ?? avatarUrl
  const initial = (initialUsername.trim()[0] ?? '?').toUpperCase()

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Selected personas travel with the form */}
      {personas.map((persona) => (
        <input key={persona} type="hidden" name="style_personas" value={persona} />
      ))}
      {/* Uploaded avatar URL travels with the form (empty = skipped) */}
      <input type="hidden" name="avatar_url" value={avatarUrl ?? ''} />

      {/* Avatar picker — circular crop preview matches how avatars render */}
      <div className="flex items-center gap-4 rounded-card border border-line bg-panel p-4">
        <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-line bg-bg2">
          {displaySrc ? (
            // Local blob / public URL preview — plain img avoids next/image
            // domain config for the transient onboarding preview.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displaySrc} alt="Your avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-serif text-[26px] font-medium text-ink-soft">
              {initial}
            </span>
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-ink/30 text-[11px] font-semibold text-bg">
              …
            </span>
          )}
        </span>
        <div className="min-w-0">
          <span className="block text-sm font-medium text-ink">Profile photo</span>
          <span className="mt-0.5 block text-[12.5px] text-ink-soft">
            Optional · square images look best, up to 5MB
          </span>
          <label className="mt-2 inline-flex cursor-pointer items-center rounded-pill bg-ink px-4 py-[7px] text-[12.5px] font-semibold text-bg transition-colors duration-[250ms] hover:bg-rust">
            {uploading ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Add a photo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                void handleAvatar(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </label>
          {avatarError && <p className="mt-2 text-[12.5px] text-rust">{avatarError}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="username" className="mb-1 block text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_]+"
          defaultValue={initialUsername}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="display_name" className="mb-1 block text-sm font-medium">
          Display name <span className="font-normal text-neutral-400">(optional)</span>
        </label>
        <input id="display_name" name="display_name" type="text" maxLength={50} className={inputClass} />
      </div>

      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium">
          Bio <span className="font-normal text-neutral-400">(optional)</span>
        </label>
        <textarea id="bio" name="bio" rows={3} maxLength={300} className={inputClass} />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Your style</legend>
        <div className="flex flex-wrap gap-2">
          {STYLE_PERSONAS.map((persona) => {
            const selected = personas.includes(persona)
            return (
              <button
                key={persona}
                type="button"
                onClick={() => togglePersona(persona)}
                aria-pressed={selected}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selected
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-300 text-neutral-600 hover:border-neutral-500'
                }`}
              >
                {persona}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="body_type" className="mb-1 block text-sm font-medium">
          Body type <span className="font-normal text-neutral-400">(optional)</span>
        </label>
        <select id="body_type" name="body_type" defaultValue="" className={inputClass}>
          <option value="">Prefer not to say</option>
          {BODY_TYPES.map((bodyType) => (
            <option key={bodyType} value={bodyType}>
              {bodyType}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium">
          Sizes <span className="font-normal text-neutral-400">(optional)</span>
        </span>
        <div className="grid grid-cols-3 gap-2">
          <input name="size_top" type="text" placeholder="Top (M)" maxLength={10} className={inputClass} />
          <input name="size_bottom" type="text" placeholder="Bottom (32)" maxLength={10} className={inputClass} />
          <input name="size_shoes" type="text" placeholder="Shoes (10)" maxLength={10} className={inputClass} />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <SubmitButton pendingText="Saving…">Finish</SubmitButton>
    </form>
  )
}
