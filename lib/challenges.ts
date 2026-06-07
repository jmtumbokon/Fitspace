import type { createClient } from '@/lib/supabase/server'

// Shared challenge helpers — submission_count is trigger-maintained on
// posts insert/delete, so it is only ever read here.

export type ChallengeRow = {
  id: string
  title: string
  description: string | null
  tag: string
  start_date: string | null
  end_date: string | null
  submission_count: number
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// Started (or no start date) and not yet ended (or no end date)
export function activeChallengesQuery(
  supabase: ReturnType<typeof createClient>,
  today: string
) {
  return supabase
    .from('challenges')
    .select('id, title, description, tag, start_date, end_date, submission_count')
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('end_date', { ascending: true, nullsFirst: false })
}

export function timeLeftLabel(endDate: string | null, today: string): string {
  if (!endDate) return 'open challenge'
  const days = Math.round(
    (new Date(`${endDate}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) /
      86_400_000
  )
  if (days <= 0) return 'ends today'
  if (days === 1) return '1 day left'
  if (days <= 14) return `${days} days left`
  return `ends ${new Date(`${endDate}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`
}
