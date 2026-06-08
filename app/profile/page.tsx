import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import RatingBadge from '@/components/RatingBadge'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { swatchFor } from '@/lib/swatch'
import { formatPrice } from '@/lib/utils'

const POSTS_LIMIT = 60

type ProfilePostRow = {
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

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const [{ data: profile }, { data: postRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    // Own posts — the select policy also surfaces the owner's hidden fits
    supabase
      .from('posts')
      .select(
        'id, image_url, caption, style_tags, event_tags, total_outfit_cost, likes_count, rating_avg, rating_count'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(POSTS_LIMIT),
  ])

  if (!profile) {
    redirect('/login')
  }

  const posts = (postRows ?? []) as unknown as ProfilePostRow[]

  return (
    <div className="mx-auto max-w-2xl px-5 pb-16">
      <MobileHeader />
      <div className="flex items-start justify-between gap-4 pt-7">
        <div className="flex min-w-0 items-center gap-4">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name ?? profile.username}
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-bg2 font-serif text-[24px] font-medium text-ink-soft">
              {(profile.display_name ?? profile.username)[0]?.toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-serif text-[27px] font-medium tracking-[-0.4px]">
              {profile.display_name ?? profile.username}
            </h1>
            <p className="truncate text-[13.5px] text-ink-soft">@{profile.username}</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="shrink-0 rounded-pill border border-line px-4 py-1.5 text-[13px] font-medium text-ink-soft transition-colors duration-[220ms] hover:border-ink-soft hover:text-ink"
          >
            Sign out
          </button>
        </form>
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

      {/* The user's own fits */}
      <div className="mt-8 border-t border-line pt-6">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[2px] text-rust">
          Your fits
        </div>
        {posts.length === 0 ? (
          <div className="rounded-card border border-line bg-panel px-5 py-14 text-center">
            <p className="text-sm text-ink-soft">Nothing on your rail yet.</p>
            <Link
              href="/post"
              className="mt-4 inline-block rounded-pill bg-ink px-5 py-2.5 text-sm font-semibold text-bg transition-colors duration-[250ms] hover:bg-rust"
            >
              + Add your first fit
            </Link>
          </div>
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
