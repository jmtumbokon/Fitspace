'use client'

import { useState, useTransition } from 'react'
import PostCard, { type PostCardData } from './PostCard'
import { createClient } from '@/lib/supabase/browser'

const PAGE_SIZE = 20

const POST_SELECT = `
  id, image_url, caption, event_tags, likes_count, comments_count, created_at,
  profile:profiles(username, avatar_url, display_name)
` as const

export default function FeedGrid({ initialPosts }: { initialPosts: PostCardData[] }) {
  const [posts, setPosts] = useState<PostCardData[]>(initialPosts)
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE)
  const [isPending, startTransition] = useTransition()

  function loadMore() {
    startTransition(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('posts')
        .select(POST_SELECT)
        .order('created_at', { ascending: false })
        .range(posts.length, posts.length + PAGE_SIZE - 1)

      if (!data || data.length === 0) {
        setHasMore(false)
        return
      }

      setPosts((prev) => [...prev, ...(data as unknown as PostCardData[])])
      if (data.length < PAGE_SIZE) setHasMore(false)
    })
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl mb-4">👕</p>
        <h2 className="text-lg font-semibold text-neutral-800">No fits posted yet</h2>
        <p className="mt-1 text-sm text-neutral-500">Be the first to share your look.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Two-column masonry grid */}
      <div className="columns-2 gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="px-6 py-2.5 rounded-full border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 transition"
          >
            {isPending ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
