import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewPostForm from './NewPostForm'

export default async function PostPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Share a fit</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Post your outfit, tag the pieces, and let people shop the look.
      </p>
      <div className="mt-6">
        <NewPostForm userId={user.id} />
      </div>
    </div>
  )
}
