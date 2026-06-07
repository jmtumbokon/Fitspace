import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { timeAgo } from '@/lib/utils'
import type { Closet } from '@/components/ClosetCard'
import ClosetWall from './ClosetWall'

// The feed IS a big shared closet: recent posts are grouped by owner and
// each person renders as one closet module on the wall.

const POST_POOL = 80 // recent posts to group into closets
const GARMENTS_PER_CLOSET = 4
const PIECES_PER_PEEK = 8

type FeedPostRow = {
  id: string
  user_id: string
  image_url: string
  caption: string | null
  style_tags: string[]
  event_tags: string[]
  rating_avg: number | null
  rating_count: number
  created_at: string
  profile: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    style_personas: string[]
    posts_count: number
    followers_count: number
  } | null
}

export default async function FeedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, user_id, image_url, caption, style_tags, event_tags, rating_avg, rating_count, created_at, profile:profiles!posts_user_id_fkey(id, username, display_name, avatar_url, style_personas, posts_count, followers_count)'
    )
    .order('created_at', { ascending: false })
    .limit(POST_POOL)

  if (error) {
    return (
      <div className="mx-auto max-w-[1240px] px-5 py-8 md:px-10">
        <p className="rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">
          Couldn&apos;t open the wardrobe: {error.message}
        </p>
      </div>
    )
  }

  // Group posts by owner, newest first — one closet per person
  const closetsByUser = new Map<string, Closet>()
  for (const row of (data ?? []) as unknown as FeedPostRow[]) {
    if (!row.profile) continue
    let closet = closetsByUser.get(row.user_id)
    if (!closet) {
      closet = {
        userId: row.user_id,
        username: row.profile.username,
        displayName: row.profile.display_name,
        avatarUrl: row.profile.avatar_url,
        persona: row.profile.style_personas[0] ?? null,
        postsCount: row.profile.posts_count,
        followersCount: row.profile.followers_count,
        tag: row.event_tags[0] ?? row.style_tags[0] ?? null,
        garments: [],
        pieces: [],
      }
      closetsByUser.set(row.user_id, closet)
    }
    if (closet.garments.length < GARMENTS_PER_CLOSET) {
      closet.garments.push({
        id: row.id,
        imageUrl: row.image_url,
        label: row.caption ?? 'fit',
        ratingAvg: row.rating_avg,
        ratingCount: row.rating_count,
      })
    }
    if (closet.pieces.length < PIECES_PER_PEEK) {
      closet.pieces.push({
        id: row.id,
        imageUrl: row.image_url,
        label: row.caption?.slice(0, 40) ?? row.style_tags[0] ?? 'a fit',
        sub: timeAgo(row.created_at),
        ratingAvg: row.rating_avg,
        ratingCount: row.rating_count,
      })
    }
  }
  const closets = Array.from(closetsByUser.values())

  // Which of these closets the viewer already follows
  let followedIds: string[] = []
  if (closets.length > 0) {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .in('following_id', closets.map((closet) => closet.userId))
    followedIds = (follows ?? []).map((follow) => follow.following_id)
  }

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-20 md:px-10">
      {/* Mobile-only wordmark header; desktop has the sidebar brand */}
      <header className="sticky top-0 z-40 -mx-5 border-b border-line bg-bg/85 px-5 py-3 backdrop-blur-[14px] md:hidden">
        <h1 className="font-serif text-[23px] font-medium tracking-[-0.4px]">FitSpace</h1>
      </header>

      {/* View head */}
      <div className="mb-7 border-b border-line pb-4 pt-7">
        <h2 className="font-serif text-[27px] font-medium tracking-[-0.4px]">The wardrobe</h2>
        <p className="mt-[3px] text-[13.5px] text-ink-soft">
          One big shared closet · peek into anyone&apos;s
        </p>
      </div>

      {closets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-24 text-center">
          <p className="font-serif text-xl">The wardrobe is empty</p>
          <p className="text-sm text-ink-soft">Be the first to hang something on the rail.</p>
          <Link
            href="/post"
            className="mt-2 rounded-pill bg-ink px-5 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-rust"
          >
            + Add a fit
          </Link>
        </div>
      ) : (
        <ClosetWall closets={closets} viewerId={user.id} initialFollowing={followedIds} />
      )}
    </div>
  )
}
