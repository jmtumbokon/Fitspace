'use client'

import { useFormState } from 'react-dom'
import { login, type AuthState } from '@/app/actions/auth'
import SubmitButton from '@/components/SubmitButton'

const initialState: AuthState = { error: null }

export default function LoginForm() {
  const [state, formAction] = useFormState(login, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
    </form>
  )
}
