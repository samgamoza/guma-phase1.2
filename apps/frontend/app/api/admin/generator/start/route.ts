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
        const url = new URL('/admin/generator', req.url)
        url.searchParams.set('error', 'Unauthorized — please log in')
        return NextResponse.redirect(url, 303)
      }
    }
  }

  const formData = await req.formData()
  const city     = (formData.get('city')     as string) || ''
  const industry = (formData.get('industry') as string) || ''
  const limit    = parseInt((formData.get('limit') as string) || '25')

  try {
    if (!GENERATOR_API_URL) {
      const url = new URL('/admin/generator', req.url)
      url.searchParams.set('error', 'GENERATOR_API_URL not set — start the generator service first.')
      return NextResponse.redirect(url, 303)
    }

    const res = await fetch(`${GENERATOR_API_URL}/jobs`, {
      method:  'POST',
      headers: {
        'Content-Type':   'application/json',
        'x-admin-secret': ADMIN_API_SECRET,
      },
      body: JSON.stringify({ city, industry, limit }),
    })

    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Generator service error')

    const url = new URL('/admin/generator', req.url)
    url.searchParams.set('success', `${result.enqueued} jobs queued`)
    return NextResponse.redirect(url, 303)
  } catch (err: any) {
    const url = new URL('/admin/generator', req.url)
    url.searchParams.set('error', err.message)
    return NextResponse.redirect(url, 303)
  }
}
