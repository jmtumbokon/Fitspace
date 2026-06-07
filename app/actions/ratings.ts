'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// rating_avg / rating_count on posts are maintained by DB triggers —
// this action only upserts the underlying ratings row.

export type RatingScores = {
  creativity: number
  wearability: number
  overall: number
}

const isScore = (n: number) => Number.isInteger(n) && n >= 1 && n <= 10

export async function ratePost(
  postId: string,
  scores: RatingScores
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (![scores.creativity, scores.wearability, scores.overall].every(isScore)) {
    return { error: 'Scores must be whole numbers from 1 to 10.' }
  }

  // One row per user per post — the (user_id, post_id) primary key makes
  // re-rating an update in place
  const { error } = await supabase.from('ratings').upsert(
    {
      user_id: user.id,
      post_id: postId,
      creativity: scores.creativity,
      wearability: scores.wearability,
      overall: scores.overall,
    },
    { onConflict: 'user_id,post_id' }
  )
  if (error) return { error: error.message }

  revalidatePath(`/post/${postId}`)
  return { error: null }
}
