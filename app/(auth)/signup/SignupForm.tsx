'use client'

import { useFormState } from 'react-dom'
import { signup, type AuthState } from '@/app/actions/auth'
import SubmitButton from '@/components/SubmitButton'

const initialState: AuthState = { error: null }

export default function SignupForm() {
  const [state, formAction] = useFormState(signup, initialState)

  if (state.message) {
    return (
      <p className="rounded-lg bg-green-50 px-3 py-3 text-center text-sm text-green-700">
        {state.message}
      </p>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="username" className="mb-1 block text-sm font-medium">
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
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black"
        />
      </div>
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
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
    </form>
  )
}
