import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import RatingBadge from '@/components/RatingBadge'
import { timeLeftLabel, todayISO, type ChallengeRow } from '@/lib/challenges'
import { createClient } from '@/lib/supabase/server'
import { swatchFor } from '@/lib/swatch'
import { formatPrice } from '@/lib/utils'

// One challenge: its brief up top, every submitted fit below, sorted by likes.

const RESULTS_LIMIT = 60

type SubmissionRow = {
  id: string
  image_url: string
  caption: string | null
  style_tags: string[]
  event_tags: string[]
  total_outfit_cost: number | null
  likes_count: number
  rating_avg: number | null
  rating_count: number
  profile: { username: string; display_name: string | null } | null
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: { tag: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const tag = decodeURIComponent(params.tag)
  const { data: challengeRow } = await supabase
    .from('challenges')
    .select('id, title, description, tag, start_date, end_date, submission_count')
    .eq('tag', tag)
    .maybeSingle()

  if (!challengeRow) {
    notFound()
  }
  const challenge = challengeRow as ChallengeRow
  const today = todayISO()
  const ended = challenge.end_date != null && challenge.end_date < today

  const { data: postRows, error } = await supabase
    .from('posts')
    .select(
      'id, image_url, caption, style_tags, event_tags, total_outfit_cost, likes_count, rating_avg, rating_count, profile:profiles!posts_user_id_fkey(username, display_name)'
    )
    .eq('challenge_tag', challenge.tag)
    .order('likes_count', { ascending: false })
    .limit(RESULTS_LIMIT)

  const posts = (postRows ?? []) as unknown as SubmissionRow[]

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-20 md:px-10">
      {/* Mobile-only wordmark header; desktop has the sidebar brand */}
      <header className="sticky top-0 z-40 -mx-5 border-b border-line bg-bg/85 px-5 py-3 backdrop-blur-[14px] md:hidden">
        <h1 className="font-serif text-[23px] font-medium tracking-[-0.4px]">FitSpace</h1>
      </header>

      {/* Challenge brief */}
      <div className="mb-7 border-b border-line pb-5 pt-7">
        <Link
          href="/challenges"
          className="text-[12.5px] font-medium text-ink-soft transition-colors hover:text-rust"
        >
          ← All challenges
        </Link>
        <div className="mt-3 text-[11px] font-semibold uppercase tracking-[2px] text-rust">
          {ended ? 'challenge over' : timeLeftLabel(challenge.end_date, today)}
        </div>
        <h2 className="mt-[5px] font-serif text-[27px] font-medium tracking-[-0.4px]">
          {challenge.title}
        </h2>
        {challenge.description && (
          <p className="mt-[5px] max-w-[640px] text-[13.5px] leading-[1.55] text-ink-soft">
            {challenge.description}
          </p>
        )}
        <p className="mt-[10px] text-[12.5px] text-ink-soft">
          #{challenge.tag} · {challenge.submission_count}{' '}
          {challenge.submission_count === 1 ? 'submission' : 'submissions'} · ranked by likes
        </p>
      </div>

      {/* Submissions */}
      {error ? (
        <p className="rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">
          Couldn’t load submissions: {error.message}
        </p>
      ) : posts.length === 0 ? (
        <div className="rounded-card border border-line bg-panel px-5 py-16 text-center">
          <p className="text-sm text-ink-soft">
            {ended
              ? 'This challenge ended without any fits on the rail.'
              : 'No fits in this challenge yet.'}
          </p>
          {!ended && (
            <Link
              href="/post"
              className="mt-4 inline-block rounded-pill bg-ink px-5 py-2.5 text-sm font-semibold text-bg transition-colors duration-[250ms] hover:bg-rust"
            >
              Be the first to enter
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-[14px] sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post, i) => {
            const name = post.profile?.display_name ?? post.profile?.username ?? 'unknown'
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
                      sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
                      className="object-cover"
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,.2),transparent_55%)]" />
                  <RatingBadge avg={post.rating_avg} count={post.rating_count} />
                </div>
                <div className="px-[11px] py-[10px]">
                  <div className="truncate text-[10.5px] font-bold uppercase tracking-[.4px] text-sage">
                    {name}
                  </div>
                  <div className="mt-0.5 truncate text-[13px] font-semibold leading-[1.2]">
                    {label}
                  </div>
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
  )
}
