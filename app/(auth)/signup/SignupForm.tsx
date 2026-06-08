'use client'

import { useFormState } from 'react-dom'
import { signup, type AuthState } from '@/app/actions/auth'
import SubmitButton from '@/components/SubmitButton'

const initialState: AuthState = { error: null }

const inputClass =
  'w-full rounded-drawer border border-line bg-panel px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-[220ms] focus:border-ink placeholder:text-ink-soft/55'
const labelClass = 'mb-1 block text-[13.5px] font-medium text-ink'

export default function SignupForm() {
  const [state, formAction] = useFormState(signup, initialState)

  if (state.message) {
    return (
      <p className="rounded-drawer bg-sage/10 px-3 py-3 text-center text-sm text-sage">
        {state.message}
      </p>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="username" className={labelClass}>
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_]+"
          placeholder="lowercase letters, numbers, _"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
      </div>

      {state.error && (
        <p className="rounded-drawer bg-rust/10 px-3 py-2 text-sm text-rust">{state.error}</p>
      )}

      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
    </form>
  )
}
