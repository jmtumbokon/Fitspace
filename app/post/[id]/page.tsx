import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import LikeButton from '@/components/LikeButton'
import CommentsSection from '@/components/CommentsSection'
import type { CommentData, CurrentUser } from '@/components/CommentsSection'

type PostDetail = {
  id: string
  image_url: string
  image_urls: string[]
  caption: string | null
  event_tags: string[]
  style_tags: string[]
  aesthetic_tags: string[]
  likes_count: number
  comments_count: number
  saves_count: number
  created_at: string
  profile: { username: string; avatar_url: string | null; display_name: string | null } | null
  outfit_items: Array<{
    id: string
    label: string | null
    brand: string | null
    item_name: string | null
    price: number | null
    currency: string
    purchase_url: string | null
  }>
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Parallel fetch: post, like status, comments, current user profile
  const [
    { data: post },
    { data: likeRecord },
    { data: rawComments },
    { data: currentProfile },
  ] = await Promise.all([
    supabase
      .from('posts')
      .select(`
        id, image_url, image_urls, caption, event_tags, style_tags, aesthetic_tags,
        likes_count, comments_count, saves_count, created_at,
        profile:profiles(username, avatar_url, display_name),
        outfit_items(id, label, brand, item_name, price, currency, purchase_url, position_x, position_y)
      `)
      .eq('id', id)
      .single<PostDetail>(),

    user
      ? supabase
          .from('likes')
          .select('user_id')
          .eq('user_id', user.id)
          .eq('post_id', id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),

    supabase
      .from('comments')
      .select(`id, body, created_at, profile:profiles(username, avatar_url)`)
      .eq('post_id', id)
      .order('created_at', { ascending: true })
      .returns<CommentData[]>(),

    user
      ? supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single<{ username: string; avatar_url: string | null }>()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (!post) notFound()

  const { profile, outfit_items: outfitItems } = post
  const isLiked = !!likeRecord
  const comments: CommentData[] = rawComments ?? []

  const currentUser: CurrentUser = user && currentProfile
    ? { id: user.id, username: currentProfile.username, avatar_url: currentProfile.avatar_url }
    : null

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur-sm px-4 py-3">
        <Link href="/feed" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition">
          ← Back to feed
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Poster info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-neutral-200 overflow-hidden shrink-0">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.username}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-neutral-600 uppercase">
                {profile?.username?.[0] ?? '?'}
              </div>
            )}
          </div>
          <span className="font-semibold text-neutral-900">@{profile?.username ?? 'unknown'}</span>
        </div>

        {/* Main photo */}
        <div className="bg-neutral-100 rounded-2xl overflow-hidden">
          <Image
            src={post.image_url}
            alt={post.caption ?? 'Outfit'}
            width={600}
            height={800}
            className="w-full h-auto object-cover"
            priority
          />
        </div>

        {/* Like + stats row */}
        <div className="flex items-center gap-5 border-b border-neutral-200 pb-3">
          <LikeButton
            postId={post.id}
            initialLiked={isLiked}
            initialCount={post.likes_count}
          />
          <span className="text-sm text-neutral-400">
            {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
          </span>
          <span className="text-sm text-neutral-400">
            {post.saves_count} saves
          </span>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-neutral-800 text-sm leading-relaxed">{post.caption}</p>
        )}

        {/* Tags */}
        {(post.event_tags?.length > 0 || post.style_tags?.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {post.event_tags?.map((tag: string) => (
              <span key={tag} className="text-xs bg-neutral-100 text-neutral-600 rounded-full px-2.5 py-1">
                {tag}
              </span>
            ))}
            {post.style_tags?.map((tag: string) => (
              <span key={tag} className="text-xs bg-neutral-900 text-white rounded-full px-2.5 py-1">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Outfit items */}
        {outfitItems?.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-neutral-800">Items in this fit</h2>
            {outfitItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">{item.item_name ?? item.label ?? 'Item'}</p>
                  <p className="text-xs text-neutral-500">{item.brand ?? '—'}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {item.price != null && (
                    <span className="text-sm font-semibold text-neutral-800">
                      {item.currency} {item.price.toFixed(0)}
                    </span>
                  )}
                  {item.purchase_url && (
                    <a
                      href={item.purchase_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-neutral-900 text-white rounded-full px-3 py-1.5 hover:bg-neutral-700 transition"
                    >
                      Shop
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comments */}
        <CommentsSection
          postId={post.id}
          initialComments={comments}
          currentUser={currentUser}
        />
      </main>
    </div>
  )
}
