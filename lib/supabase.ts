import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── Browser client (use in client components) ────────────────────────────────
export function createClient() {
  return createBrowserClient<Database>(URL, ANON)
}
