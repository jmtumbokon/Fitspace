'use server'

import { createClient } from '@/lib/supabase/server'

// Moderation reports — insert-only from the app; review happens in
// Supabase directly. RLS: users insert as themselves and can read only
// their own reports (which is what the duplicate check relies on).

export async function submitReport(input: {
  postId?: string
  commentId?: string
  reason: string
}): Promise<{ error: string | null; already: boolean }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', already: false }

  const reason = input.reason.trim().slice(0, 500)
  if (!reason) return { error: 'Add a short reason first.', already: false }
  if (!input.postId && !input.commentId) return { error: 'Nothing to report.', already: false }

  // Check the reporter's own prior reports for a friendly already-reported
  // notice without round-tripping an insert failure.
  let dupCheck = supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', user.id)
    .limit(1)
  dupCheck = input.commentId
    ? dupCheck.eq('comment_id', input.commentId)
    : dupCheck.eq('post_id', input.postId!).is('comment_id', null)
  const { data: existing, error: dupError } = await dupCheck.maybeSingle()
  if (dupError) return { error: dupError.message, already: false }
  if (existing) return { error: null, already: true }

  // Comment reports carry post_id too, as context for review
  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    post_id: input.postId ?? null,
    comment_id: input.commentId ?? null,
    reason,
  })
  if (error) {
    // Unique partial indexes backstop the check above — a concurrent
    // double-submit lands here and still reads as "already reported"
    if (error.code === '23505') return { error: null, already: true }
    return { error: error.message, already: false }
  }

  return { error: null, already: false }
}
