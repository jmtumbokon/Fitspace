import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import FollowButton from '@/components/FollowButton'
import MobileHeader from '@/components/MobileHeader'
import RatingBadge from '@/components/RatingBadge'
import { createClient } from '@/lib/supabase/server'
import { swatchFor } from '@/lib/swatch'
import { formatPrice } from '@/lib/utils'

const POSTS_LIMIT = 60

type Props = { params: { username: string } }

type PublicPostRow = {
  id: string
  image_url: string
  caption: string | null
  style_tags: string[]
  event_tags: string[]
  total_outfit_cost: number | null
  likes_count: number
  rating_avg: number | null
  rating_count: number
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('username', decodeURIComponent(params.username).toLowerCase())
    .maybeSingle()
  if (!data) return { title: 'Profile — FitSpace' }
  return { title: `${data.display_name ?? data.username} (@${data.username}) — FitSpace` }
}

export default async function PublicProfilePage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const username = decodeURIComponent(params.username).toLowerCase()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (!profile) {
    notFound()
  }
  // Viewing your own handle → the editable own-profile page
  if (profile.id === user.id) {
    redirect('/profile')
  }

  const [{ data: postRows }, { data: followRow }] = await Promise.all([
    // Non-owner: the select policy already hides this user's hidden fits
    supabase
      .from('posts')
      .select(
        'id, image_url, caption, style_tags, event_tags, total_outfit_cost, likes_count, rating_avg, rating_count'
      )
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(POSTS_LIMIT),
    supabase
      .from('follows')
      .select('follower_id')
      .match({ follower_id: user.id, following_id: profile.id })
      .maybeSingle(),
  ])

  const posts = (postRows ?? []) as unknown as PublicPostRow[]
  const isFollowing = Boolean(followRow)
  const name = profile.display_name ?? profile.username

  return (
    <div className="mx-auto max-w-2xl px-5 pb-16">
      <MobileHeader />

      <div className="flex items-start justify-between gap-4 pt-7">
        <div className="flex min-w-0 items-center gap-4">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={name}
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-bg2 font-serif text-[24px] font-medium text-ink-soft">
              {name[0]?.toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-serif text-[27px] font-medium tracking-[-0.4px]">{name}</h1>
            <p className="truncate text-[13.5px] text-ink-soft">@{profile.username}</p>
          </div>
        </div>
        <FollowButton targetUserId={profile.id} initialFollowing={isFollowing} />
      </div>

      {profile.bio && <p className="mt-4 text-[14px] leading-[1.55] text-ink">{profile.bio}</p>}

      <div className="mt-5 flex gap-7 text-[13px] text-ink-soft">
        <span>
          <b className="font-serif text-[18px] font-medium text-ink">{profile.posts_count}</b> posts
        </span>
        <span>
          <b className="font-serif text-[18px] font-medium text-ink">{profile.followers_count}</b> followers
        </span>
        <span>
          <b className="font-serif text-[18px] font-medium text-ink">{profile.following_count}</b> following
        </span>
      </div>

      {profile.style_personas.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[2px] text-rust">
            Style
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.style_personas.map((persona) => (
              <span
                key={persona}
                className="rounded-pill border border-line bg-panel px-3 py-1 text-xs font-medium text-ink-soft"
              >
                {persona}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Their fits */}
      <div className="mt-8 border-t border-line pt-6">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[2px] text-rust">
          Fits
        </div>
        {posts.length === 0 ? (
          <p className="rounded-card border border-line bg-panel px-5 py-14 text-center text-sm text-ink-soft">
            @{profile.username} hasn’t hung any fits on the rail yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-[14px] sm:grid-cols-3">
            {posts.map((post, i) => {
              const label = post.caption || post.style_tags[0] || post.event_tags[0] || 'a fit'
              return (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="group overflow-hidden rounded-[10px] border border-line-soft bg-panel transition-transform duration-[250ms] hover:-translate-y-[3px]"
                >
                  <div
                    className="relative aspect-[4/5]"
                    style={post.image_url ? undefined : { background: swatchFor(post.id, i) }}
                  >
                    {post.image_url && (
                      <Image
                        src={post.image_url}
                        alt={label}
                        fill
                        sizes="(min-width: 640px) 220px, 50vw"
                        className="object-cover"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,.2),transparent_55%)]" />
                    <RatingBadge avg={post.rating_avg} count={post.rating_count} />
                  </div>
                  <div className="px-[11px] py-[10px]">
                    <div className="truncate text-[13px] font-semibold leading-[1.2]">{label}</div>
                    <div className="mt-[7px] flex justify-between text-[11px] text-ink-soft">
                      <span>
                        {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
                      </span>
                      {post.total_outfit_cost != null && (
                        <b className="font-bold text-rust">{formatPrice(post.total_outfit_cost)}</b>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
