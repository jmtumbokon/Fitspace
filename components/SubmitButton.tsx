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
      className="w-full rounded-pill bg-ink py-3 text-sm font-semibold text-bg transition-colors duration-[250ms] hover:bg-rust disabled:opacity-60"
    >
      {pending ? pendingText : children}
    </button>
  )
}
