import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BattleCard, { type Battle } from './BattleCard'

// Style battles — two fits side by side, the community picks one.
// votes_a/votes_b are trigger-maintained on battle_votes inserts.

type BattlePostRow = {
  id: string
  image_url: string
  caption: string | null
  profile: { username: string; display_name: string | null } | null
}

type BattleRow = {
  id: string
  theme: string | null
  votes_a: number
  votes_b: number
  post_a: BattlePostRow | null
  post_b: BattlePostRow | null
}

function toSide(post: BattlePostRow) {
  return {
    postId: post.id,
    imageUrl: post.image_url,
    caption: post.caption,
    name: post.profile?.display_name ?? post.profile?.username ?? 'unknown',
  }
}

export default async function BattlesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('style_battles')
    .select(
      `id, theme, votes_a, votes_b,
       post_a:posts!style_battles_post_id_a_fkey(id, image_url, caption, profile:profiles!posts_user_id_fkey(username, display_name)),
       post_b:posts!style_battles_post_id_b_fkey(id, image_url, caption, profile:profiles!posts_user_id_fkey(username, display_name))`
    )
    .eq('active', true)
    .order('created_at', { ascending: false })

  // Drop battles where a post is gone or hidden (RLS nulls the embed)
  const rows = ((data ?? []) as unknown as BattleRow[]).filter(
    (row) => row.post_a && row.post_b
  )

  const battles: Battle[] = rows.map((row) => ({
    id: row.id,
    theme: row.theme,
    votesA: row.votes_a,
    votesB: row.votes_b,
    a: toSide(row.post_a!),
    b: toSide(row.post_b!),
  }))

  // The viewer's existing votes — battles they've voted in show results
  let myVotes = new Map<string, string>()
  if (battles.length > 0) {
    const { data: votes } = await supabase
      .from('battle_votes')
      .select('battle_id, voted_for')
      .eq('user_id', user.id)
      .in('battle_id', battles.map((battle) => battle.id))
    myVotes = new Map(
      (votes ?? [])
        .filter((vote) => vote.voted_for != null)
        .map((vote) => [vote.battle_id, vote.voted_for as string])
    )
  }

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-20 md:px-10">
      {/* Mobile-only wordmark header; desktop has the sidebar brand */}
      <header className="sticky top-0 z-40 -mx-5 border-b border-line bg-bg/85 px-5 py-3 backdrop-blur-[14px] md:hidden">
        <h1 className="font-serif text-[23px] font-medium tracking-[-0.4px]">FitSpace</h1>
      </header>

      {/* View head */}
      <div className="mb-7 border-b border-line pb-4 pt-7">
        <h2 className="font-serif text-[27px] font-medium tracking-[-0.4px]">Style battles</h2>
        <p className="mt-[3px] text-[13.5px] text-ink-soft">
          Two fits walk in · you pick one
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">
          Couldn’t load battles: {error.message}
        </p>
      ) : battles.length === 0 ? (
        <p className="rounded-card border border-line bg-panel px-5 py-16 text-center text-sm text-ink-soft">
          No battles are running right now — check back soon.
        </p>
      ) : (
        <div className="mx-auto flex max-w-[680px] flex-col gap-6">
          {battles.map((battle) => (
            <BattleCard
              key={battle.id}
              battle={battle}
              initialVote={myVotes.get(battle.id) ?? null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
