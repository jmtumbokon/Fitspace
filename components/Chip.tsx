'use client'

// Filter pill from the mockup's .chip — `on` state is an ink fill.
export default function Chip({
  on = false,
  onClick,
  children,
}: {
  on?: boolean
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`whitespace-nowrap rounded-pill border px-[15px] py-[7px] font-sans text-[13px] font-medium transition-all duration-[220ms] ${
        on
          ? 'border-ink bg-ink text-bg'
          : 'border-line bg-panel text-ink-soft hover:border-ink-soft hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
