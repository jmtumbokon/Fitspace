import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import RatingBadge from '@/components/RatingBadge'
import { createClient } from '@/lib/supabase/server'
import { swatchFor } from '@/lib/swatch'
import { formatPrice } from '@/lib/utils'
import StyleMeControls, { type PickerItem } from './StyleMeControls'

const RESULTS_LIMIT = 30
const MATCH_POOL = 400 // outfit_items rows to score posts from
const ITEMS_SHOWN = 4 // outfit items listed per result card

// Words too generic to search or match ownership on
const STOPWORDS = new Set([
  'the', 'and', 'with', 'for', 'from', 'that', 'this', 'its', 'her', 'his',
  'our', 'your', 'fit', 'outfit', 'piece', 'pair', 'some', 'wear', 'wearing',
])

// Distinct lowercase tokens worth matching on
function toWords(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
    )
  )
}

type OutfitItemRow = {
  id: string
  label: string | null
  brand: string | null
  item_name: string | null
}

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
  created_at: string
  outfit_items: OutfitItemRow[]
  profile: { username: string; display_name: string | null } | null
}

function itemText(item: { item_name: string | null; brand: string | null; label?: string | null }): string {
  return [item.item_name, item.brand, item.label].filter(Boolean).join(' ')
}

export default async function StyleMePage({
  searchParams,
}: {
  searchParams: { q?: string; item?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // The user's closet — RLS scopes to them. Feeds the picker, the search
  // terms in item mode, and the "in your closet" cross-check.
  const { data: wardrobeRows } = await supabase
    .from('wardrobe_items')
    .select('id, item_name, brand, label, category, is_wishlist')
    .order('created_at', { ascending: false })

  const owned = (wardrobeRows ?? []).filter((row) => !row.is_wishlist)
  const pickerItems: PickerItem[] = owned.map((row) => ({
    id: row.id,
    name:
      [row.brand, row.item_name].filter(Boolean).join(' ') ||
      row.label ||
      row.category ||
      'piece',
  }))

  // Resolve the search subject + terms from either entry mode
  const q = searchParams.q?.trim() ?? ''
  const pickedId = searchParams.item ?? ''
  const picked = pickedId ? owned.find((row) => row.id === pickedId) ?? null : null

  let subject = ''
  let terms: string[] = []
  let notice: string | null = null

  if (pickedId && !picked) {
    notice = 'That piece isn’t in your closet anymore — pick another or describe it instead.'
  } else if (picked) {
    subject = pickerItems.find((item) => item.id === picked.id)?.name ?? 'that piece'
    terms = toWords([picked.item_name, picked.brand, picked.category].filter(Boolean).join(' '))
  } else if (q) {
    subject = q
    terms = toWords(q)
    if (terms.length === 0) {
      notice = 'Those words are too generic to match on — try naming the piece, brand, or color.'
    }
  }

  // Layer 1: find posts whose tagged outfit_items mention the words (ilike,
  // case-insensitive), scored by how many distinct words a single item hits.
  let posts: ResultRow[] = []
  let searchError: string | null = null

  if (terms.length > 0) {
    const orFilter = terms
      .map((word) => `item_name.ilike.%${word}%,brand.ilike.%${word}%,label.ilike.%${word}%`)
      .join(',')
    const { data: matches, error: matchError } = await supabase
      .from('outfit_items')
      .select('post_id, item_name, brand, label')
      .or(orFilter)
      .limit(MATCH_POOL)

    if (matchError) {
      searchError = matchError.message
    } else {
      const scores = new Map<string, number>()
      for (const match of matches ?? []) {
        const text = itemText(match).toLowerCase()
        const hits = terms.filter((word) => text.includes(word)).length
        scores.set(match.post_id, Math.max(scores.get(match.post_id) ?? 0, hits))
      }

      const postIds = Array.from(scores.keys()).slice(0, 100)
      if (postIds.length > 0) {
        const { data: results, error } = await supabase
          .from('posts')
          .select(
            'id, image_url, caption, style_tags, event_tags, total_outfit_cost, likes_count, rating_avg, rating_count, created_at, outfit_items(id, label, brand, item_name), profile:profiles!posts_user_id_fkey(username, display_name)'
          )
          .in('id', postIds)

        if (error) {
          searchError = error.message
        } else {
          posts = ((results ?? []) as unknown as ResultRow[])
            .sort(
              (a, b) =>
                (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) ||
                +new Date(b.created_at) - +new Date(a.created_at)
            )
            .slice(0, RESULTS_LIMIT)
        }
      }
    }
  }

  // Layer 2: ownership cross-check. An outfit item "looks owned" when it
  // shares enough meaningful words with a closet piece's name/brand/category.
  const ownedWordSets = owned
    .map((row) => toWords([row.item_name, row.brand, row.category].filter(Boolean).join(' ')))
    .filter((set) => set.length > 0)

  const looksOwned = (item: OutfitItemRow): boolean => {
    const words = new Set(toWords(itemText(item)))
    return ownedWordSets.some((set) => {
      const shared = set.filter((word) => words.has(word)).length
      return shared >= Math.min(2, set.length)
    })
  }

  const searched = terms.length > 0

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-20 md:px-10">
      {/* Mobile-only wordmark header; desktop has the sidebar brand */}
      <header className="sticky top-0 z-40 -mx-5 border-b border-line bg-bg/85 px-5 py-3 backdrop-blur-[14px] md:hidden">
        <h1 className="font-serif text-[23px] font-medium tracking-[-0.4px]">FitSpace</h1>
      </header>

      {/* View head */}
      <div className="mb-7 border-b border-line pb-4 pt-7">
        <h2 className="font-serif text-[27px] font-medium tracking-[-0.4px]">What goes with?</h2>
        <p className="mt-[3px] text-[13.5px] text-ink-soft">
          Name a piece · see how the community actually wears it
        </p>
      </div>

      <StyleMeControls items={pickerItems} initial={{ q, itemId: picked?.id ?? '' }} />

      {/* Results */}
      {searchError ? (
        <p className="mt-7 rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">
          Search failed: {searchError}
        </p>
      ) : notice ? (
        <p className="mt-7 rounded-card border border-line bg-panel px-5 py-16 text-center text-sm text-ink-soft">
          {notice}
        </p>
      ) : !searched ? (
        <p className="mt-7 rounded-card border border-line bg-panel px-5 py-16 text-center text-sm text-ink-soft">
          Describe a piece above — or tap one from your closet — and we’ll pull
          real fits it was tagged in. Pieces you already own get flagged.
        </p>
      ) : posts.length === 0 ? (
        <p className="mt-7 rounded-card border border-line bg-panel px-5 py-16 text-center text-sm text-ink-soft">
          No fits feature “{subject}” yet — try fewer or broader words.
        </p>
      ) : (
        <>
          <p className="mt-7 text-[13.5px] text-ink-soft">
            {posts.length} {posts.length === 1 ? 'fit styles' : 'fits style'}{' '}
            <b className="font-semibold text-ink">{subject}</b>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-[14px] md:grid-cols-3">
            {posts.map((post, i) => {
              const name = post.profile?.display_name ?? post.profile?.username ?? 'unknown'
              const label = post.caption || post.style_tags[0] || post.event_tags[0] || 'a fit'
              // Owned pieces first so their badges survive the cut
              const items = [...post.outfit_items]
                .map((item) => ({ item, owned: looksOwned(item) }))
                .sort((a, b) => Number(b.owned) - Number(a.owned))
              return (
                <div
                  key={post.id}
                  className="overflow-hidden rounded-[10px] border border-line-soft bg-panel transition-transform duration-[250ms] hover:-translate-y-[3px]"
                >
                  <Link href={`/post/${post.id}`} className="block">
                    <div
                      className="relative aspect-[4/5]"
                      style={post.image_url ? undefined : { background: swatchFor(post.id, i) }}
                    >
                      {post.image_url && (
                        <Image
                          src={post.image_url}
                          alt={label}
                          fill
                          sizes="(min-width: 768px) 33vw, 50vw"
                          className="object-cover"
                        />
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,.2),transparent_55%)]" />
                      <RatingBadge avg={post.rating_avg} count={post.rating_count} />
                    </div>
                  </Link>
                  <div className="px-[11px] py-[10px]">
                    <div className="truncate text-[10.5px] font-bold uppercase tracking-[.4px] text-sage">
                      {name}
                    </div>
                    <Link
                      href={`/post/${post.id}`}
                      className="mt-0.5 block truncate text-[13px] font-semibold leading-[1.2]"
                    >
                      {label}
                    </Link>
                    <div className="mt-[7px] flex justify-between text-[11px] text-ink-soft">
                      <span>
                        {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
                      </span>
                      {post.total_outfit_cost != null && (
                        <b className="font-bold text-rust">{formatPrice(post.total_outfit_cost)}</b>
                      )}
                    </div>

                    {/* The pieces in this fit, with ownership flags */}
                    {items.length > 0 && (
                      <ul className="mt-[9px] flex flex-col gap-[5px] border-t border-line-soft pt-[8px]">
                        {items.slice(0, ITEMS_SHOWN).map(({ item, owned: isOwned }) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between gap-2 text-[11px] text-ink-soft"
                          >
                            <span className="truncate">
                              {itemText(item) || item.label || 'piece'}
                            </span>
                            {isOwned && (
                              <span className="shrink-0 rounded-pill border border-sage/40 bg-sage/10 px-[7px] py-[2px] text-[9px] font-bold uppercase tracking-[.4px] text-sage">
                                in your closet
                              </span>
                            )}
                          </li>
                        ))}
                        {items.length > ITEMS_SHOWN && (
                          <li className="text-[11px] text-ink-soft/70">
                            +{items.length - ITEMS_SHOWN} more{' '}
                            {items.length - ITEMS_SHOWN === 1 ? 'piece' : 'pieces'}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
