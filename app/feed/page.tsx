import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logOut } from '@/app/actions/auth'
import FeedGrid from '@/components/FeedGrid'
import type { PostCardData } from '@/components/PostCard'
import Link from 'next/link'

const PAGE_SIZE = 20

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: posts }] = await Promise.all([
    supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single<{ username: string; avatar_url: string | null }>(),
    supabase
      .from('posts')
      .select(`
        id, image_url, caption, event_tags, likes_count, comments_count, created_at,
        profile:profiles(username, avatar_url, display_name)
      `)
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1),
  ])

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-bold tracking-tight">FitSpace</span>
        <div className="flex items-center gap-4">
          <Link
            href="/new"
            className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-700 transition text-xl leading-none"
            aria-label="New post"
          >
            +
          </Link>
          <span className="text-sm text-neutral-600">
            @{profile?.username ?? user.email}
          </span>
          <form action={logOut}>
            <button
              type="submit"
              className="text-sm text-neutral-500 hover:text-neutral-900 transition"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      {/* Feed */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <FeedGrid initialPosts={(posts ?? []) as unknown as PostCardData[]} />
      </main>
    </div>
  )
}
