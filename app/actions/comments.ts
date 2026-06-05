'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// comments_count and comment notifications are maintained by DB triggers.

export type CommentState = { error: string | null }

export async function addComment(_prev: CommentState, formData: FormData): Promise<CommentState> {
  const postId = String(formData.get('post_id') ?? '')
  const body = String(formData.get('body') ?? '').trim().slice(0, 1000)

  if (!postId) return { error: 'Missing post.' }
  if (!body) return { error: 'Comment can’t be empty.' }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('comments')
    .insert({ user_id: user.id, post_id: postId, body })
  if (error) return { error: error.message }

  revalidatePath(`/post/${postId}`)
  revalidatePath('/feed')
  return { error: null }
}

export async function deleteComment(commentId: string, postId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // RLS only allows deleting your own comments
  await supabase.from('comments').delete().match({ id: commentId, user_id: user.id })

  revalidatePath(`/post/${postId}`)
  revalidatePath('/feed')
}
