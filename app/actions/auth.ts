'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthState = {
  error?: string
  fieldErrors?: {
    email?: string
    password?: string
    username?: string
  }
}

export async function signUp(
  _state: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string
  const username = (formData.get('username') as string).trim().toLowerCase()

  // Basic validation
  const fieldErrors: AuthState['fieldErrors'] = {}
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fieldErrors.email = 'Enter a valid email address.'
  if (!password || password.length < 8)
    fieldErrors.password = 'Password must be at least 8 characters.'
  if (!username || username.length < 3)
    fieldErrors.username = 'Username must be at least 3 characters.'
  if (username && !/^[a-z0-9_]+$/.test(username))
    fieldErrors.username = 'Username can only contain letters, numbers, and underscores.'

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Passed to the handle_new_user trigger to set username + display_name
      data: { username, display_name: username },
    },
  })

  if (error) return { error: error.message }

  redirect('/feed')
}

export async function logIn(
  _state: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const email = (formData.get('email') as string).trim()
  const password = formData.get('password') as string

  if (!email) return { fieldErrors: { email: 'Enter your email.' } }
  if (!password) return { fieldErrors: { password: 'Enter your password.' } }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: 'Invalid email or password.' }

  redirect('/feed')
}

export async function logOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
