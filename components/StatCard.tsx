// Stat tile from the mockup's .statcard — serif number + small label.
// `accent` variant is dark ink with the number in rust.
export default function StatCard({
  value,
  label,
  accent = false,
}: {
  value: React.ReactNode
  label: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-drawer border p-[18px] ${
        accent ? 'border-ink bg-ink' : 'border-line bg-panel'
      }`}
    >
      <div
        className={`font-serif text-[30px] font-medium leading-none ${
          accent ? 'text-rust' : 'text-ink'
        }`}
      >
        {value}
      </div>
      <div className={`mt-[5px] text-[12.5px] ${accent ? 'text-bg/70' : 'text-ink-soft'}`}>
        {label}
      </div>
    </div>
  )
}
