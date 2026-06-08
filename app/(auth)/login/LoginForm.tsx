'use client'

import { useFormState } from 'react-dom'
import { login, type AuthState } from '@/app/actions/auth'
import SubmitButton from '@/components/SubmitButton'

const initialState: AuthState = { error: null }

const inputClass =
  'w-full rounded-drawer border border-line bg-panel px-3.5 py-2.5 text-sm text-ink outline-none transition-colors duration-[220ms] focus:border-ink placeholder:text-ink-soft/55'
const labelClass = 'mb-1 block text-[13.5px] font-medium text-ink'

export default function LoginForm() {
  const [state, formAction] = useFormState(login, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      {state.error && (
        <p className="rounded-drawer bg-rust/10 px-3 py-2 text-sm text-rust">{state.error}</p>
      )}

      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
    </form>
  )
}
