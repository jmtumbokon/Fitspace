'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// votes_a / votes_b on style_battles are maintained by a DB trigger on
// battle_votes inserts — this action only inserts the vote row. The
// (user_id, battle_id) primary key + insert-only RLS make votes final.

export async function voteInBattle(
  battleId: string,
  postId: string
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // The counter trigger keys off voted_for matching post_id_a — guard
  // against votes for a post that isn't in the battle.
  const { data: battle, error: battleError } = await supabase
    .from('style_battles')
    .select('post_id_a, post_id_b, active')
    .eq('id', battleId)
    .maybeSingle()
  if (battleError) return { error: battleError.message }
  if (!battle || !battle.active) return { error: 'This battle is no longer active.' }
  if (postId !== battle.post_id_a && postId !== battle.post_id_b) {
    return { error: 'That fit isn’t in this battle.' }
  }

  const { error } = await supabase
    .from('battle_votes')
    .insert({ user_id: user.id, battle_id: battleId, voted_for: postId })
  if (error) {
    return {
      error:
        error.code === '23505' ? 'You’ve already voted in this battle.' : error.message,
    }
  }

  revalidatePath('/battles')
  return { error: null }
}
