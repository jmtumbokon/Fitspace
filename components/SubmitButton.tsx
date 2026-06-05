'use client'

import { useFormStatus } from 'react-dom'

export default function SubmitButton({
  children,
  pendingText = 'Working…',
}: {
  children: React.ReactNode
  pendingText?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
    >
      {pending ? pendingText : children}
    </button>
  )
}
