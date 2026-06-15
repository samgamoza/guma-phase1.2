import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── Server client (use in Server Components, Route Handlers, Server Actions) ─
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(URL, ANON, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}
