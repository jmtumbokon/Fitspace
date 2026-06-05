'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { USERNAME_REGEX } from '@/lib/constants'

export type AuthState = {
  error: string | null
  message?: string
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: error.message }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', data.user.id)
    .single()

  redirect(profile?.onboarded ? '/feed' : '/onboarding')
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const username = String(formData.get('username') ?? '').trim().toLowerCase()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!USERNAME_REGEX.test(username)) {
    return { error: 'Username must be 3–20 characters: lowercase letters, numbers, and underscores.' }
  }
  if (!email) {
    return { error: 'Email is required.' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const supabase = createClient()

  // Pre-check so a username collision doesn't surface as an opaque
  // "Database error saving new user" from the handle_new_user trigger.
  const { data: taken } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  if (taken) {
    return { error: 'That username is taken.' }
  }

  const origin = headers().get('origin')
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // handle_new_user trigger reads this to set profiles.username
      data: { username },
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
    },
  })
  if (error) {
    return { error: error.message }
  }

  // Supabase returns a stub user (no identities) when the email is already registered.
  if (data.user && data.user.identities?.length === 0) {
    return { error: 'An account with this email already exists. Try logging in.' }
  }

  if (data.session) {
    // Email confirmation disabled — user is signed in immediately.
    redirect('/onboarding')
  }

  return { error: null, message: 'Check your email for a confirmation link to finish signing up.' }
}

export async function completeOnboarding(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const username = String(formData.get('username') ?? '').trim().toLowerCase()
  if (!USERNAME_REGEX.test(username)) {
    return { error: 'Username must be 3–20 characters: lowercase letters, numbers, and underscores.' }
  }

  const display_name = String(formData.get('display_name') ?? '').trim() || null
  const bio = String(formData.get('bio') ?? '').trim() || null
  const style_personas = formData.getAll('style_personas').map(String)
  const body_type = String(formData.get('body_type') ?? '') || null
  const size_top = String(formData.get('size_top') ?? '').trim() || null
  const size_bottom = String(formData.get('size_bottom') ?? '').trim() || null
  const size_shoes = String(formData.get('size_shoes') ?? '').trim() || null

  const { error } = await supabase
    .from('profiles')
    .update({
      username,
      display_name,
      bio,
      style_personas,
      body_type,
      size_top,
      size_bottom,
      size_shoes,
      onboarded: true,
    })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'That username is taken.' }
    }
    return { error: error.message }
  }

  redirect('/feed')
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
