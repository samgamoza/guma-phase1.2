import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const GENERATOR_API_URL = process.env.GENERATOR_API_URL || ''
const ADMIN_API_SECRET  = process.env.ADMIN_API_SECRET  || ''

export async function POST(req: NextRequest) {
  // Dev bypass — matches requireAdminSession() behaviour in lib/admin-auth.ts
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev) {
    const adminSession = req.cookies.get('admin_session')?.value
    if (!adminSession) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => req.cookies.get(name)?.value, set: () => {}, remove: () => {} } }
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
  }

  const formData = await req.formData()
  const websiteId = formData.get('website_id') as string

  if (!websiteId) {
    return NextResponse.json({ error: 'Missing website_id' }, { status: 400 })
  }

  try {
    if (!GENERATOR_API_URL) {
      return NextResponse.json({ error: 'GENERATOR_API_URL not configured' }, { status: 503 })
    }

    const res = await fetch(`${GENERATOR_API_URL}/jobs/retry`, {
      method:  'POST',
      headers: {
        'Content-Type':   'application/json',
        'x-admin-secret': ADMIN_API_SECRET,
      },
      body: JSON.stringify({ websiteId }),
    })

    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Generator retry failed')

    const url = new URL('/admin/generator', req.url)
    url.searchParams.set('success', 'Retry queued')
    return NextResponse.redirect(url, 303)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
