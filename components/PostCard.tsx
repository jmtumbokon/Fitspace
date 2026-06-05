import Image from 'next/image'
import LikeButton from '@/components/LikeButton'
import SaveButton from '@/components/SaveButton'
import { formatPrice, timeAgo } from '@/lib/utils'
import type { Post } from '@/types'

export default function PostCard({ post }: { post: Post }) {
  const profile = post.profile
  const name = profile?.display_name ?? profile?.username ?? 'unknown'
  const tags = [...post.style_tags, ...post.aesthetic_tags].slice(0, 4)
  const extraImages = post.image_urls.length > 1 ? post.image_urls.length : 0

  return (
    <article className="border-b border-neutral-200 pb-4">
      {/* Header */}
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

      {/* Image */}
      <div className="relative aspect-[4/5] bg-neutral-100">
        <Image
          src={post.image_url}
          alt={post.caption ?? `Outfit by ${name}`}
          fill
          sizes="(min-width: 768px) 672px, 100vw"
          className="object-cover"
        />
        {extraImages > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            1/{extraImages}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 pt-3">
        <LikeButton
          postId={post.id}
          initialLiked={post.is_liked ?? false}
          initialCount={post.likes_count}
        />
        <span className="flex items-center gap-1.5 text-sm text-neutral-600">
          <svg className="h-6 w-6 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
            />
          </svg>
          <span className="tabular-nums">{post.comments_count > 0 ? post.comments_count : ''}</span>
        </span>
        <div className="ml-auto">
          <SaveButton postId={post.id} initialSaved={post.is_saved ?? false} />
        </div>
      </div>

      {/* Caption + meta */}
      <div className="flex flex-col gap-2 px-4 pt-2">
        {post.caption && (
          <p className="text-sm">
            <span className="font-semibold">{profile?.username}</span> {post.caption}
          </p>
        )}
        {(tags.length > 0 || post.total_outfit_cost != null) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
                {tag}
              </span>
            ))}
            {post.total_outfit_cost != null && (
              <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                {formatPrice(post.total_outfit_cost)} fit
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
