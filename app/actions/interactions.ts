'use server'

import { createClient } from '@/lib/supabase/server'

export async function toggleLike(postId: string): Promise<{ liked: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: existing } = await supabase
    .from('likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)
    if (error) throw new Error(error.message)
    return { liked: false }
  } else {
    const { error } = await supabase
      .from('likes')
      .insert({ user_id: user.id, post_id: postId })
    if (error) throw new Error(error.message)
    return { liked: true }
  }
}

export async function addComment(
  postId: string,
  body: string
): Promise<{ id: string; created_at: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const trimmed = body.trim()
  if (!trimmed) throw new Error('Comment cannot be empty')

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({ user_id: user.id, post_id: postId, body: trimmed })
    .select('id, created_at')
    .single<{ id: string; created_at: string }>()

  if (error || !comment) throw new Error(error?.message ?? 'Failed to post comment')
  return comment
}
