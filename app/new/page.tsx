import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewPostWizard from './NewPostWizard'

export default async function NewPostPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-neutral-50">
      <NewPostWizard />
    </div>
  )
}
