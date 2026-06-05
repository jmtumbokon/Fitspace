import Link from 'next/link'
import { redirect } from 'next/navigation'
import PostCard from '@/components/PostCard'
import { createClient } from '@/lib/supabase/server'
import type { Post } from '@/types'

const FEED_LIMIT = 24

export default async function FeedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // RLS hides other users' hidden posts; triggers keep the counters fresh.
  const { data, error } = await supabase
    .from('posts')
    .select('*, profile:profiles(*)')
    .order('created_at', { ascending: false })
    .limit(FEED_LIMIT)

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Couldn&apos;t load the feed: {error.message}
        </p>
      </div>
    )
  }

  const posts = (data ?? []) as unknown as Post[]

  // Current user's like/save state for the fetched posts, one query each
  if (posts.length > 0) {
    const postIds = posts.map((post) => post.id)
    const [{ data: likes }, { data: saves }] = await Promise.all([
      supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
      supabase.from('saves').select('post_id').eq('user_id', user.id).in('post_id', postIds),
    ])
    const likedIds = new Set((likes ?? []).map((like) => like.post_id))
    const savedIds = new Set((saves ?? []).map((save) => save.post_id))
    for (const post of posts) {
      post.is_liked = likedIds.has(post.id)
      post.is_saved = savedIds.has(post.id)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Mobile-only wordmark header; desktop has the sidebar brand */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <h1 className="text-xl font-bold tracking-tight">FitSpace</h1>
      </header>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-24 text-center">
          <p className="text-lg font-semibold">No fits yet</p>
          <p className="text-sm text-neutral-500">Be the first to share an outfit.</p>
          <Link
            href="/post"
            className="mt-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-85"
          >
            Share a fit
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2 md:py-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
