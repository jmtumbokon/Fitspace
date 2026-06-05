'use client'

import { useState } from 'react'

// Collapsible drawer from the mockup's .drawer — wood face with a knob,
// serif name, count, and a body that slides open via max-height.
export default function DrawerSection({
  name,
  count,
  defaultOpen = false,
  children,
}: {
  name: string
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="drawer-grain relative overflow-hidden rounded-drawer border border-wood-dk bg-wood">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="relative z-[2] flex w-full select-none items-center gap-[14px] px-5 py-4 text-left"
      >
        <span className="h-[11px] w-[30px] rounded-lg bg-wood-dk shadow-[inset_0_-1px_2px_rgba(0,0,0,.25)]" />
        <span className="font-serif text-[19px] font-medium text-ink">{name}</span>
        <span className="ml-auto text-[13px] font-medium text-[rgba(36,31,26,.6)]">
          {count} {count === 1 ? 'piece' : 'pieces'}
        </span>
        <span
          aria-hidden
          className={`text-sm text-[rgba(36,31,26,.6)] transition-transform duration-[400ms] ease-[cubic-bezier(.3,1.1,.5,1)] ${
            open ? 'rotate-180' : ''
          }`}
        >
          ▾
        </span>
      </button>
      <div
        className={`relative z-[2] overflow-hidden bg-bg2 transition-[max-height] duration-500 ease-[cubic-bezier(.4,0,.2,1)] ${
          open ? 'max-h-[300px]' : 'max-h-0'
        }`}
      >
        <div className="flex gap-3 overflow-x-auto px-5 py-[18px]">{children}</div>
      </div>
    </div>
  )
}
