import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client for server-side use
 * @returns {import('@supabase/supabase-js').SupabaseClient} - The Supabase client instance
 */
export function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE, // server-only secret
    { auth: { persistSession: false } }
  )
}