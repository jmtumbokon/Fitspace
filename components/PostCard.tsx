import Link from 'next/link'
import Image from 'next/image'

export type PostCardData = {
  id: string
  image_url: string
  caption: string | null
  event_tags: string[]
  likes_count: number
  comments_count: number
  created_at: string
  profile: {
    username: string
    avatar_url: string | null
    display_name: string | null
  } | null
}

export default function PostCard({ post }: { post: PostCardData }) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="block break-inside-avoid mb-4 group"
    >
      <div className="bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        {/* Outfit photo */}
        <div className="relative w-full bg-neutral-100">
          <Image
            src={post.image_url}
            alt={post.caption ?? 'Outfit post'}
            width={600}
            height={800}
            className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Card body */}
        <div className="px-3 py-3 space-y-2">
          {/* Avatar + username */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-neutral-200 overflow-hidden shrink-0">
              {post.profile?.avatar_url ? (
                <Image
                  src={post.profile.avatar_url}
                  alt={post.profile.username}
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-300 flex items-center justify-center text-xs font-bold text-neutral-600 uppercase">
                  {post.profile?.username?.[0] ?? '?'}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-neutral-800 truncate">
              @{post.profile?.username ?? 'unknown'}
            </span>
          </div>

          {/* Event tag pills */}
          {post.event_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.event_tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5"
                >
                  {tag}
                </span>
              ))}
              {post.event_tags.length > 3 && (
                <span className="text-xs text-neutral-400">
                  +{post.event_tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Counts */}
          <div className="flex items-center gap-3 text-xs text-neutral-500 pt-0.5">
            <span className="flex items-center gap-1">
              <HeartIcon />
              {post.likes_count}
            </span>
            <span className="flex items-center gap-1">
              <CommentIcon />
              {post.comments_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function HeartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
