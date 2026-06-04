// Re-export the browser client as the default supabase singleton.
// Use lib/supabase/server.ts in Server Components and Server Actions.
export { createClient } from '@/lib/supabase/browser'
