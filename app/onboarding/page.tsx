import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingForm from './OnboardingForm'

export default async function OnboardingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Profile row is auto-created by the handle_new_user trigger on signup.
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, bio, style_personas, body_type, size_top, size_bottom, size_shoes, onboarded')
    .eq('id', user.id)
    .single()

  if (profile?.onboarded) {
    redirect('/feed')
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold">Set up your profile</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Tell us about your style so we can personalize your feed. You can change all of this later.
      </p>
      <div className="mt-8">
        <OnboardingForm
          initialUsername={profile?.username ?? ''}
          initialPersonas={profile?.style_personas ?? []}
        />
      </div>
    </div>
  )
}
