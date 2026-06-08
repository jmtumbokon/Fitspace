'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { completeOnboarding, type AuthState } from '@/app/actions/auth'
import Chip from '@/components/Chip'
import { createClient } from '@/lib/supabase/client'
import { AVATARS_BUCKET, BODY_TYPES, MAX_AVATAR_BYTES, STYLE_PERSONAS } from '@/lib/constants'

const initialState: AuthState = { error: null }

const inputClass =
  'w-full rounded-drawer border border-line bg-panel px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-[220ms] focus:border-ink placeholder:text-ink-soft/55'

const labelClass = 'mb-1 block text-[13.5px] font-medium text-ink'
const optionalClass = 'font-normal text-ink-soft'

// Local closet-pill submit — keeps the shared SubmitButton (login/signup)
// on its original styling.
function FinishButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill bg-ink py-3 text-sm font-semibold text-bg transition-colors duration-[250ms] hover:bg-rust disabled:opacity-60"
    >
      {pending ? 'Saving…' : 'Finish setup'}
    </button>
  )
}

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
          <span className="block text-[13.5px] font-medium text-ink">Profile photo</span>
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
        <label htmlFor="username" className={labelClass}>
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
        <label htmlFor="display_name" className={labelClass}>
          Display name <span className={optionalClass}>(optional)</span>
        </label>
        <input id="display_name" name="display_name" type="text" maxLength={50} className={inputClass} />
      </div>

      <div>
        <label htmlFor="bio" className={labelClass}>
          Bio <span className={optionalClass}>(optional)</span>
        </label>
        <textarea id="bio" name="bio" rows={3} maxLength={300} className={`${inputClass} resize-none`} />
      </div>

      <fieldset>
        <legend className="mb-2 text-[13.5px] font-medium text-ink">Your style</legend>
        <div className="flex flex-wrap gap-2">
          {STYLE_PERSONAS.map((persona) => (
            <Chip
              key={persona}
              on={personas.includes(persona)}
              onClick={() => togglePersona(persona)}
            >
              {persona}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="body_type" className={labelClass}>
          Body type <span className={optionalClass}>(optional)</span>
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
        <span className={labelClass}>
          Sizes <span className={optionalClass}>(optional)</span>
        </span>
        <div className="grid grid-cols-3 gap-2">
          <input name="size_top" type="text" placeholder="Top (M)" maxLength={10} className={inputClass} />
          <input name="size_bottom" type="text" placeholder="Bottom (32)" maxLength={10} className={inputClass} />
          <input name="size_shoes" type="text" placeholder="Shoes (10)" maxLength={10} className={inputClass} />
        </div>
      </div>

      {state.error && (
        <p className="rounded-drawer bg-rust/10 px-3 py-2 text-sm text-rust">{state.error}</p>
      )}

      <FinishButton />
    </form>
  )
}
