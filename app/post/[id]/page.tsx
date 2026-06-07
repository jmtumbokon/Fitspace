import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { deleteComment } from '@/app/actions/comments'
import LikeButton from '@/components/LikeButton'
import SaveButton from '@/components/SaveButton'
import { createClient } from '@/lib/supabase/server'
import { formatPrice, timeAgo } from '@/lib/utils'
import type { Comment, Post } from '@/types'
import type { RatingScores } from '@/app/actions/ratings'
import CommentForm from './CommentForm'
import ImageGallery from './ImageGallery'
import RatingPanel from './RatingPanel'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase
    .from('posts')
    .select('caption, profile:profiles!posts_user_id_fkey(username)')
    .eq('id', params.id)
    .maybeSingle()
  if (!data) return { title: 'Post — FitSpace' }
  const username = (data.profile as { username: string } | null)?.username
  return {
    title: data.caption
      ? `${data.caption.slice(0, 60)} — FitSpace`
      : `@${username}'s fit — FitSpace`,
  }
}

export default async function PostDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data } = await supabase
    .from('posts')
    .select('*, profile:profiles!posts_user_id_fkey(*), outfit_items(*)')
    .eq('id', params.id)
    .maybeSingle()

  if (!data) {
    notFound()
  }

  const post = data as unknown as Post
  const profile = post.profile
  const name = profile?.display_name ?? profile?.username ?? 'unknown'
  const images = post.image_urls.length > 0 ? post.image_urls : [post.image_url]
  const items = post.outfit_items ?? []
  const tags = [...post.style_tags, ...post.aesthetic_tags, ...post.event_tags]

  const [{ data: comments }, { count: likeCount }, { data: savedRow }] = await Promise.all([
    supabase
      .from('comments')
      .select('*, profile:profiles!comments_user_id_fkey(username, display_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)
      .eq('user_id', user.id),
    supabase
      .from('saves')
      .select('post_id')
      .match({ post_id: post.id, user_id: user.id })
      .maybeSingle(),
  ])

  const commentList = (comments ?? []) as unknown as Comment[]
  const isLiked = (likeCount ?? 0) > 0
  const isSaved = Boolean(savedRow)

  // Fit ratings — only when the poster opted in. rating_avg/rating_count on
  // the post are trigger-maintained; creativity/wearability averages are
  // computed here from the underlying rows.
  let myRating: RatingScores | null = null
  let ratingAverages: RatingScores | null = null
  if (post.ratings_enabled) {
    const [{ data: ratingRows }, { data: mine }] = await Promise.all([
      supabase
        .from('ratings')
        .select('creativity, wearability, overall')
        .eq('post_id', post.id)
        .limit(500),
      supabase
        .from('ratings')
        .select('creativity, wearability, overall')
        .match({ post_id: post.id, user_id: user.id })
        .maybeSingle(),
    ])
    myRating = (mine as RatingScores | null) ?? null
    const rows = (ratingRows ?? []) as RatingScores[]
    if (rows.length > 0) {
      const avg = (key: keyof RatingScores) =>
        rows.reduce((sum, row) => sum + row[key], 0) / rows.length
      ratingAverages = {
        creativity: avg('creativity'),
        wearability: avg('wearability'),
        // prefer the trigger-maintained exact average for overall
        overall: post.rating_avg != null ? Number(post.rating_avg) : avg('overall'),
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl md:py-8">
      {/* Author header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={name}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold uppercase text-neutral-600">
            {(profile?.username ?? '?')[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          {profile?.username && profile.display_name && (
            <p className="truncate text-xs text-neutral-400">@{profile.username}</p>
          )}
        </div>
        <span className="text-xs text-neutral-400">{timeAgo(post.created_at)}</span>
      </div>

      <ImageGallery urls={images} alt={post.caption ?? `Outfit by ${name}`} />

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 pt-3">
        <LikeButton postId={post.id} initialLiked={isLiked} initialCount={post.likes_count} />
        <span className="flex items-center gap-1.5 text-sm text-neutral-600">
          <svg className="h-6 w-6 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
            />
          </svg>
          <span className="tabular-nums">{commentList.length > 0 ? commentList.length : ''}</span>
        </span>
        <div className="ml-auto">
          <SaveButton postId={post.id} initialSaved={isSaved} />
        </div>
      </div>

      {/* Caption + tags */}
      <div className="flex flex-col gap-2 px-4 pt-2">
        {post.caption && (
          <p className="text-sm">
            <span className="font-semibold">{profile?.username}</span> {post.caption}
          </p>
        )}
        {(tags.length > 0 || post.season) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {post.season && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                {post.season}
              </span>
            )}
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Shop the look */}
      {items.length > 0 && (
        <section className="mt-6 px-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Shop the look</h2>
            {post.total_outfit_cost != null && (
              <span className="text-xs font-medium text-green-700">
                {formatPrice(post.total_outfit_cost)} total
              </span>
            )}
          </div>
          <ul className="mt-2 divide-y divide-neutral-100 rounded-lg border border-neutral-200">
            {items.map((item) => {
              const itemName = [item.brand, item.item_name].filter(Boolean).join(' — ') || item.label || 'Item'
              const link = item.affiliate_url ?? item.purchase_url
              return (
                <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{itemName}</p>
                    {item.price != null && (
                      <p className="text-xs text-neutral-500">{formatPrice(item.price, item.currency)}</p>
                    )}
                  </div>
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1 text-xs font-medium hover:border-neutral-500"
                    >
                      Shop
                    </a>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Fit ratings */}
      {post.ratings_enabled && (
        <section className="mt-6 px-4">
          <RatingPanel
            postId={post.id}
            isOwner={post.user_id === user.id}
            initial={myRating}
            averages={ratingAverages}
            count={post.rating_count}
          />
        </section>
      )}

      {/* Comments */}
      <section className="mt-6 px-4 pb-8">
        <h2 className="text-sm font-semibold">
          Comments{commentList.length > 0 && ` (${commentList.length})`}
        </h2>

        <div className="mt-3 flex flex-col gap-4">
          {commentList.length === 0 && (
            <p className="text-sm text-neutral-400">No comments yet. Say something nice.</p>
          )}
          {commentList.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3">
              {comment.profile?.avatar_url ? (
                <Image
                  src={comment.profile.avatar_url}
                  alt={comment.profile.username}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold uppercase text-neutral-600">
                  {(comment.profile?.username ?? '?')[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{comment.profile?.username ?? 'unknown'}</span>{' '}
                  {comment.body}
                </p>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-neutral-400">
                  <span>{timeAgo(comment.created_at)}</span>
                  {comment.user_id === user.id && (
                    <form action={deleteComment.bind(null, comment.id, post.id)}>
                      <button type="submit" className="hover:text-red-500 hover:underline">
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <CommentForm postId={post.id} />
        </div>
      </section>

      <div className="px-4 pb-8 md:hidden">
        <Link href="/feed" className="text-sm text-neutral-500 hover:underline">
          ← Back to feed
        </Link>
      </div>
    </div>
  )
}
