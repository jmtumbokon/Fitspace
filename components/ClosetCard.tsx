'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { swatchFor } from '@/lib/swatch'

// One person's closet module — THE feed unit (mockup .closet).
// A wood-grain panel: owner header, garments hanging on a rail
// (drop on hover), and a "peek inside" footer.

export type ClosetGarment = {
  id: string
  imageUrl: string | null
  label: string
}

export type ClosetPiece = ClosetGarment & {
  sub: string | null
}

export type Closet = {
  userId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  persona: string | null
  postsCount: number
  followersCount: number
  tag: string | null
  garments: ClosetGarment[]
  pieces: ClosetPiece[]
}

export function closetInitials(closet: Closet): string {
  const source = closet.displayName ?? closet.username
  const parts = source.trim().split(/\s+/)
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : source.slice(0, 2).toUpperCase()
}

const GARMENT_DROP_DELAYS = ['0s', '.04s', '.08s', '.12s']

export default function ClosetCard({
  closet,
  index,
  onPeek,
}: {
  closet: Closet
  index: number
  onPeek: () => void
}) {
  const name = closet.displayName ?? closet.username

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1], delay: (index % 6) * 0.07 }}
      onClick={onPeek}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPeek()
        }
      }}
      className="closet-grain group relative cursor-pointer overflow-hidden rounded-card border border-wood-dk bg-wood shadow-[0_1px_0_rgba(255,255,255,.3)_inset,0_14px_30px_-20px_rgba(36,31,26,.4)] transition-shadow duration-500 hover:shadow-[0_1px_0_rgba(255,255,255,.3)_inset,0_26px_44px_-22px_rgba(36,31,26,.5)]"
    >
      {/* Owner header */}
      <div className="relative z-[3] flex items-center gap-[10px] bg-gradient-to-b from-wood-dk to-wood px-4 py-[14px]">
        {closet.avatarUrl ? (
          <Image
            src={closet.avatarUrl}
            alt={name}
            width={34}
            height={34}
            className="h-[34px] w-[34px] shrink-0 rounded-full object-cover shadow-[0_2px_6px_rgba(0,0,0,.15)]"
          />
        ) : (
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-panel text-[13px] font-bold text-ink shadow-[0_2px_6px_rgba(0,0,0,.15)]">
            {closetInitials(closet)}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold leading-[1.1] text-panel">{name}</div>
          <div className="truncate text-[11.5px] text-[rgba(251,248,242,.7)]">
            @{closet.username} · {closet.postsCount} {closet.postsCount === 1 ? 'piece' : 'pieces'}
          </div>
        </div>
        {closet.persona && (
          <div className="ml-auto whitespace-nowrap rounded-[20px] bg-[rgba(251,248,242,.18)] px-[10px] py-1 text-[11px] font-semibold text-panel">
            {closet.persona}
          </div>
        )}
      </div>

      {/* Rail + garments */}
      <div className="relative z-[2] px-3 pt-[10px]">
        <div className="mx-2 mt-1 h-1 rounded bg-wood-dk shadow-[0_1px_2px_rgba(0,0,0,.2)]" />
        <div className="-mt-0.5 flex gap-2 px-1.5">
          {closet.garments.map((garment, j) => (
            <div
              key={garment.id}
              className="flex-1 origin-top transition-transform duration-[400ms] ease-[cubic-bezier(.3,1.2,.5,1)] group-hover:translate-y-[6px]"
              style={{ transitionDelay: GARMENT_DROP_DELAYS[j] ?? '0s' }}
            >
              {/* hook */}
              <div className="relative z-[2] mx-auto h-[13px] w-[13px] rounded-t-full border-2 border-b-0 border-wood-dk" />
              {/* swatch: photo, or fabric-gradient fallback */}
              <div
                className="relative -mt-px h-[130px] overflow-hidden rounded-[4px_4px_9px_9px] border border-[rgba(36,31,26,.18)]"
                style={garment.imageUrl ? undefined : { background: swatchFor(garment.id, j) }}
              >
                {garment.imageUrl && (
                  <Image
                    src={garment.imageUrl}
                    alt={garment.label}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,.18),transparent_50%)]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-[3] flex items-center gap-[14px] px-4 pb-[15px] pt-[13px] text-[12.5px] font-medium text-[rgba(36,31,26,.7)]">
        {closet.tag && (
          <span className="rounded-[14px] bg-[rgba(251,248,242,.55)] px-[9px] py-[3px] text-[11px]">
            {closet.tag}
          </span>
        )}
        <span>
          {closet.followersCount} {closet.followersCount === 1 ? 'follower' : 'followers'}
        </span>
        <span className="ml-auto flex items-center gap-[5px] font-semibold text-ink transition-colors duration-[250ms] group-hover:text-rust">
          Peek inside{' '}
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-[3px]">
            →
          </span>
        </span>
      </div>
    </motion.div>
  )
}
