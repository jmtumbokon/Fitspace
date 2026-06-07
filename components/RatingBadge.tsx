// Overall community score chip for post/garment cards. Only renders once a
// post has enough ratings to mean something (rating_count > 5). Place inside
// a `relative` image container.

export const MIN_RATINGS_FOR_BADGE = 5

export default function RatingBadge({
  avg,
  count,
}: {
  avg: number | null
  count: number
}) {
  if (avg == null || count <= MIN_RATINGS_FOR_BADGE) return null
  return (
    <span className="absolute right-[6px] top-[6px] z-[2] rounded-pill bg-ink/70 px-2 py-[3px] font-serif text-[11.5px] font-medium leading-none text-panel backdrop-blur-[2px]">
      {Number(avg).toFixed(1)}
      <span className="opacity-70">/10</span>
    </span>
  )
}
