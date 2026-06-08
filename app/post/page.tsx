import { redirect } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import { activeChallengesQuery, todayISO, type ChallengeRow } from '@/lib/challenges'
import { createClient } from '@/lib/supabase/server'
import NewPostForm from './NewPostForm'

export default async function PostPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Active challenges the poster can enter this fit into
  const { data: challengeRows } = await activeChallengesQuery(supabase, todayISO())
  const challenges = ((challengeRows ?? []) as ChallengeRow[]).map((challenge) => ({
    tag: challenge.tag,
    title: challenge.title,
  }))

  return (
    <div className="mx-auto max-w-lg px-5 pb-16">
      <MobileHeader />
      <div className="pt-7">
        <h1 className="font-serif text-[29px] font-medium tracking-[-0.4px]">Share a fit</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-soft">
          Post your outfit, tag the pieces, and let people shop the look.
        </p>
      </div>
      <div className="mt-8">
        <NewPostForm userId={user.id} challenges={challenges} />
      </div>
    </div>
  )
}
