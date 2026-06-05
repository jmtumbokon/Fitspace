'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { completeOnboarding, type AuthState } from '@/app/actions/auth'
import { BODY_TYPES, STYLE_PERSONAS } from '@/lib/constants'
import SubmitButton from '@/components/SubmitButton'

const initialState: AuthState = { error: null }

const inputClass =
  'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black'

export default function OnboardingForm({
  initialUsername,
  initialPersonas,
}: {
  initialUsername: string
  initialPersonas: string[]
}) {
  const [state, formAction] = useFormState(completeOnboarding, initialState)
  const [personas, setPersonas] = useState<string[]>(initialPersonas)

  const togglePersona = (persona: string) => {
    setPersonas((prev) =>
      prev.includes(persona) ? prev.filter((p) => p !== persona) : [...prev, persona]
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Selected personas travel with the form */}
      {personas.map((persona) => (
        <input key={persona} type="hidden" name="style_personas" value={persona} />
      ))}

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
