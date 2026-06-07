import Link from 'next/link'
import { redirect } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import SectionTabs, { FEED_SECTION_TABS } from '@/components/SectionTabs'
import {
  activeChallengesQuery,
  timeLeftLabel,
  todayISO,
  type ChallengeRow,
} from '@/lib/challenges'
import { createClient } from '@/lib/supabase/server'

// Weekly challenges — themed prompts the community posts fits into.

export default async function ChallengesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const today = todayISO()
  const { data, error } = await activeChallengesQuery(supabase, today)
  const challenges = (data ?? []) as ChallengeRow[]

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-20 md:px-10">
      <MobileHeader />

      {/* View head */}
      <div className="mb-7 border-b border-line pb-4 pt-7">
        <h2 className="font-serif text-[27px] font-medium tracking-[-0.4px]">Weekly challenges</h2>
        <p className="mt-[3px] text-[13.5px] text-ink-soft">
          A theme, a deadline · hang your take on the rail
        </p>
        <SectionTabs tabs={FEED_SECTION_TABS} active="/challenges" />
      </div>

      {error ? (
        <p className="rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust">
          Couldn’t load challenges: {error.message}
        </p>
      ) : challenges.length === 0 ? (
        <p className="rounded-card border border-line bg-panel px-5 py-16 text-center text-sm text-ink-soft">
          No challenges are running right now — check back soon.
        </p>
      ) : (
        <div className="grid gap-[18px] sm:grid-cols-2">
          {challenges.map((challenge) => (
            <Link
              key={challenge.id}
              href={`/challenges/${encodeURIComponent(challenge.tag)}`}
              className="group flex flex-col rounded-card border border-line bg-panel p-5 transition-transform duration-[250ms] hover:-translate-y-[3px]"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[2px] text-rust">
                {timeLeftLabel(challenge.end_date, today)}
              </div>
              <h3 className="mt-[6px] font-serif text-[21px] font-medium tracking-[-0.3px]">
                {challenge.title}
              </h3>
              {challenge.description && (
                <p className="mt-[5px] text-[13.5px] leading-[1.5] text-ink-soft">
                  {challenge.description}
                </p>
              )}
              <div className="mt-auto flex items-baseline justify-between pt-4 text-[12.5px] text-ink-soft">
                <span>
                  #{challenge.tag} · {challenge.submission_count}{' '}
                  {challenge.submission_count === 1 ? 'submission' : 'submissions'}
                </span>
                <span className="flex items-center gap-[5px] font-semibold text-ink transition-colors duration-[250ms] group-hover:text-rust">
                  See the fits{' '}
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-[3px]"
                  >
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
