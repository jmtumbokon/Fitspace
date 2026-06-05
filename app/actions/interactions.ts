'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Counters (likes_count, saves_count) are maintained by DB triggers —
// these actions only insert/delete the underlying rows.

async function requireUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function likePost(postId: string): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not authenticated' }

  // ignoreDuplicates: a double-tap race must not fire the counter trigger twice
  const { error } = await supabase
    .from('likes')
    .upsert(
      { user_id: user.id, post_id: postId },
      { onConflict: 'user_id,post_id', ignoreDuplicates: true }
    )
  if (error) return { error: error.message }

  revalidatePath('/feed')
  return { error: null }
}

export async function unlikePost(postId: string): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('likes')
    .delete()
    .match({ user_id: user.id, post_id: postId })
  if (error) return { error: error.message }

  revalidatePath('/feed')
  return { error: null }
}

export async function followUser(userId: string): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not authenticated' }
  if (user.id === userId) return { error: 'You can’t follow yourself.' }

  // Trigger maintains follower/following counts and the notification
  const { error } = await supabase
    .from('follows')
    .upsert(
      { follower_id: user.id, following_id: userId },
      { onConflict: 'follower_id,following_id', ignoreDuplicates: true }
    )
  if (error) return { error: error.message }

  revalidatePath('/feed')
  return { error: null }
}

export async function unfollowUser(userId: string): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('follows')
    .delete()
    .match({ follower_id: user.id, following_id: userId })
  if (error) return { error: error.message }

  revalidatePath('/feed')
  return { error: null }
}

export async function savePost(postId: string): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('saves')
    .upsert(
      { user_id: user.id, post_id: postId },
      { onConflict: 'user_id,post_id', ignoreDuplicates: true }
    )
  if (error) return { error: error.message }

  revalidatePath('/feed')
  return { error: null }
}

export async function unsavePost(postId: string): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('saves')
    .delete()
    .match({ user_id: user.id, post_id: postId })
  if (error) return { error: error.message }

  revalidatePath('/feed')
  return { error: null }
}
