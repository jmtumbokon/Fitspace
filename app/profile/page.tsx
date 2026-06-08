import Image from 'next/image'
import { redirect } from 'next/navigation'
import MobileHeader from '@/components/MobileHeader'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-16">
      <MobileHeader />
      <div className="flex items-start justify-between gap-4 pt-7">
        <div className="flex min-w-0 items-center gap-4">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name ?? profile.username}
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-bg2 font-serif text-[24px] font-medium text-ink-soft">
              {(profile.display_name ?? profile.username)[0]?.toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-serif text-[27px] font-medium tracking-[-0.4px]">
              {profile.display_name ?? profile.username}
            </h1>
            <p className="truncate text-[13.5px] text-ink-soft">@{profile.username}</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="shrink-0 rounded-pill border border-line px-4 py-1.5 text-[13px] font-medium text-ink-soft transition-colors duration-[220ms] hover:border-ink-soft hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </div>

      {profile.bio && <p className="mt-4 text-[14px] leading-[1.55] text-ink">{profile.bio}</p>}

      <div className="mt-5 flex gap-7 text-[13px] text-ink-soft">
        <span>
          <b className="font-serif text-[18px] font-medium text-ink">{profile.posts_count}</b> posts
        </span>
        <span>
          <b className="font-serif text-[18px] font-medium text-ink">{profile.followers_count}</b> followers
        </span>
        <span>
          <b className="font-serif text-[18px] font-medium text-ink">{profile.following_count}</b> following
        </span>
      </div>

      {profile.style_personas.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[2px] text-rust">
            Style
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.style_personas.map((persona) => (
              <span
                key={persona}
                className="rounded-pill border border-line bg-panel px-3 py-1 text-xs font-medium text-ink-soft"
              >
                {persona}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
