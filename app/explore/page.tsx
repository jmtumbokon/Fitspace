import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import RatingBadge from '@/components/RatingBadge'
import { createClient } from '@/lib/supabase/server'
import { swatchFor } from '@/lib/swatch'
import { formatPrice } from '@/lib/utils'
import ExploreControls, { type ExploreFilters } from './ExploreControls'

const RESULTS_LIMIT = 30
const TAG_POOL = 200 // recent posts to tally trending/aesthetic tags from
const TRENDING_COUNT = 8

type ResultRow = {
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

function tally(lists: string[][], top: number): string[] {
  const counts = new Map<string, number>()
  for (const list of lists) {
    for (const tag of list) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([tag]) => tag)
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: { q?: string; season?: string; tags?: string; max?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const filters: ExploreFilters = {
    q: searchParams.q?.trim() ?? '',
    season: searchParams.season ?? '',
    tags: searchParams.tags?.split(',').map((t) => t.trim()).filter(Boolean) ?? [],
    max: searchParams.max && Number.isFinite(Number(searchParams.max)) ? Number(searchParams.max) : null,
  }

  // Results query — search_tsv is trigger-maintained over caption + tags
  let query = supabase
    .from('posts')
    .select(
      'id, image_url, caption, style_tags, event_tags, total_outfit_cost, likes_count, rating_avg, rating_count, profile:profiles!posts_user_id_fkey(username, display_name)'
    )
    .order('created_at', { ascending: false })
    .limit(RESULTS_LIMIT)

  if (filters.q) {
    query = query.textSearch('search_tsv', filters.q, { type: 'websearch', config: 'english' })
  }
  if (filters.season) {
    query = query.eq('season', filters.season)
  }
  if (filters.tags.length > 0) {
    query = query.overlaps('aesthetic_tags', filters.tags)
  }
  if (filters.max != null) {
    query = query.lte('total_outfit_cost', filters.max)
  }

  // Tag pools for trending events + aesthetic filter options
  const [{ data: results, error }, { data: tagRows }] = await Promise.all([
    query,
    supabase
      .from('posts')
      .select('event_tags, aesthetic_tags')
      .order('created_at', { ascending: false })
      .limit(TAG_POOL),
  ])

  const posts = (results ?? []) as unknown as ResultRow[]
  const trending = tally((tagRows ?? []).map((row) => row.event_tags), TRENDING_COUNT)
  const aestheticOptions = tally((tagRows ?? []).map((row) => row.aesthetic_tags), 8)

  const isFiltered =
    Boolean(filters.q) || Boolean(filters.season) || filters.tags.length > 0 || filters.max != null

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-20 md:px-10">
      {/* Mobile-only wordmark header; desktop has the sidebar brand */}
      <header className="sticky top-0 z-40 -mx-5 border-b border-line bg-bg/85 px-5 py-3 backdrop-blur-[14px] md:hidden">
        <h1 className="font-serif text-[23px] font-medium tracking-[-0.4px]">FitSpace</h1>
      </header>

      {/* View head */}
      <div className="mb-7 border-b border-line pb-4 pt-7">
        <h2 className="font-serif text-[27px] font-medium tracking-[-0.4px]">Explore</h2>
        <p className="mt-[3px] text-[13.5px] text-ink-soft">
          Search the shared closet · by occasion, style, or piece
        </p>
      </div>

      <ExploreControls trending={trending} aestheticOptions={aestheticOptions} initial={filters} />

      {/* Results */}
      {error ? (
        <p className="mt-7 rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">
          Search failed: {error.message}
        </p>
      ) : posts.length === 0 ? (
        <p className="mt-7 rounded-card border border-line bg-panel px-5 py-16 text-center text-sm text-ink-soft">
          {isFiltered
            ? 'Nothing in the closet matches — try loosening a filter.'
            : 'Nothing here yet. Once people post fits, they’ll show up to explore.'}
        </p>
      ) : (
        <div className="mt-7 grid grid-cols-2 gap-[14px] sm:grid-cols-3 lg:grid-cols-4">
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
