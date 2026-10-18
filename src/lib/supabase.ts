// The Supabase client, or null when the project isn't configured (D-043).
// The game is local-first: with no VITE_SUPABASE_* values (tests, offline builds, a fresh clone)
// every caller gets null and simply skips syncing. Both values are public by design; the
// service-role key never goes near this project.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export type Supabase = SupabaseClient<Database>

/** A client for this URL and key, or null if either is missing. Kept separate so it can be tested. */
export function makeSupabase(url: string | undefined, key: string | undefined): Supabase | null {
  if (!url || !key) return null
  // PKCE: the email link brings back a "?code=" instead of tokens after "#", which the app's hash routes use.
  return createClient<Database>(url, key, { auth: { flowType: 'pkce' } })
}

export const supabase = makeSupabase(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
