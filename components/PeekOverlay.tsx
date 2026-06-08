'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { followUser, unfollowUser } from '@/app/actions/interactions'
import { closetInitials, type Closet } from '@/components/ClosetCard'
import RatingBadge from '@/components/RatingBadge'
import { swatchFor } from '@/lib/swatch'

// Slide-up peek modal (mockup .scrim / .peekcard): owner header,
// 3 stat tiles, piece grid, follow button.

export default function PeekOverlay({
  closet,
  isOwn,
  isFollowing,
  onClose,
  onFollowChange,
}: {
  closet: Closet | null
  isOwn: boolean
  isFollowing: boolean
  onClose: () => void
  onFollowChange: (userId: string, following: boolean) => void
}) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Lock page scroll + close on Escape while open
  useEffect(() => {
    if (!closet) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [closet, onClose])

  const toggleFollow = () => {
    if (!closet) return
    const next = !isFollowing
    setError(null)
    onFollowChange(closet.userId, next) // optimistic
    startTransition(async () => {
      const { error } = next
        ? await followUser(closet.userId)
        : await unfollowUser(closet.userId)
      if (error) {
        onFollowChange(closet.userId, !next)
        setError(error)
      }
    })
  }

  const name = closet ? closet.displayName ?? closet.username : ''
  const firstName = name.split(' ')[0]

  return (
    <AnimatePresence>
      {closet && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          className="fixed inset-0 z-[300] flex items-start justify-center bg-[rgba(36,31,26,.5)] px-5 py-10 backdrop-blur-[3px]"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.9, 0.2, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={`${name}'s closet`}
            className="w-full max-w-[640px] overflow-hidden rounded-2xl bg-bg shadow-[0_40px_80px_-30px_rgba(0,0,0,.6)]"
          >
            {/* Owner header */}
            <div className="relative flex items-center gap-[14px] bg-gradient-to-b from-wood-dk to-wood px-6 py-[22px]">
              {closet.avatarUrl ? (
                <Image
                  src={closet.avatarUrl}
                  alt={name}
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 rounded-full object-cover shadow-[0_2px_6px_rgba(0,0,0,.15)]"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-panel text-[17px] font-bold text-ink shadow-[0_2px_6px_rgba(0,0,0,.15)]">
                  {closetInitials(closet)}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate font-serif text-[21px] font-medium text-panel">{name}</div>
                <div className="truncate text-[13px] text-[rgba(251,248,242,.75)]">
                  @{closet.username}
                  {closet.persona && ` · ${closet.persona}`} · {closet.postsCount}{' '}
                  {closet.postsCount === 1 ? 'piece' : 'pieces'}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(36,31,26,.25)] text-base text-panel transition-colors duration-200 hover:bg-[rgba(36,31,26,.5)]"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto px-6 pb-[26px] pt-[22px]">
              {/* Stats */}
              <div className="mb-5 flex gap-[10px]">
                {[
                  { v: closet.postsCount, k: 'pieces' },
                  { v: closet.followersCount, k: 'followers' },
                  { v: closet.persona ?? '—', k: 'primary style' },
                ].map((stat) => (
                  <div
                    key={stat.k}
                    className="min-w-0 flex-1 rounded-[10px] border border-line-soft bg-panel p-[13px]"
                  >
                    <div className="truncate font-serif text-[22px] font-medium">{stat.v}</div>
                    <div className="mt-0.5 text-[11.5px] text-ink-soft">{stat.k}</div>
                  </div>
                ))}
              </div>

              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[2px] text-rust">
                In their closet
              </div>

              {/* Piece grid */}
              <div className="mb-[22px] grid grid-cols-3 gap-[10px] sm:grid-cols-4">
                {closet.pieces.map((piece, k) => (
                  <Link
                    key={piece.id}
                    href={`/post/${piece.id}`}
                    className="overflow-hidden rounded-[9px] border border-line-soft bg-panel"
                  >
                    <div
                      className="relative h-20"
                      style={piece.imageUrl ? undefined : { background: swatchFor(piece.id, k) }}
                    >
                      {piece.imageUrl && (
                        <Image
                          src={piece.imageUrl}
                          alt={piece.label}
                          fill
                          sizes="160px"
                          className="object-cover"
                        />
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,.2),transparent_55%)]" />
                      <RatingBadge avg={piece.ratingAvg} count={piece.ratingCount} />
                    </div>
                    <div className="px-2 py-[7px] text-[11px] font-semibold leading-[1.2]">
                      <span className="block truncate">{piece.label}</span>
                      {piece.sub && (
                        <span className="block truncate text-[10px] font-normal text-ink-soft">
                          {piece.sub}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {error && (
                <p className="mb-3 rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">{error}</p>
              )}

              {!isOwn && (
                <button
                  type="button"
                  onClick={toggleFollow}
                  className={`w-full rounded-pill p-[13px] font-sans text-[14.5px] font-semibold transition-colors duration-[250ms] ${
                    isFollowing
                      ? 'border border-line bg-panel text-ink hover:border-ink-soft'
                      : 'bg-ink text-bg hover:bg-rust'
                  }`}
                >
                  {isFollowing ? 'Following — tap to unfollow' : `Follow ${firstName}'s closet`}
                </button>
              )}

              <Link
                href={isOwn ? '/profile' : `/u/${closet.username}`}
                onClick={onClose}
                className="mt-3 block text-center text-[13px] font-semibold text-ink-soft transition-colors duration-[220ms] hover:text-rust"
              >
                View full closet →
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
