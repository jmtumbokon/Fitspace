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
      <div className="flex items-start justify-between pt-7">
        <div>
          <h1 className="text-2xl font-bold">
            {profile.display_name ?? profile.username}
          </h1>
          <p className="text-sm text-neutral-500">@{profile.username}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:border-neutral-500"
          >
            Sign out
          </button>
        </form>
      </div>

      {profile.bio && <p className="mt-4 text-sm">{profile.bio}</p>}

      <div className="mt-4 flex gap-6 text-sm">
        <span><strong>{profile.posts_count}</strong> posts</span>
        <span><strong>{profile.followers_count}</strong> followers</span>
        <span><strong>{profile.following_count}</strong> following</span>
      </div>

      {profile.style_personas.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.style_personas.map((persona) => (
            <span
              key={persona}
              className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600"
            >
              {persona}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
