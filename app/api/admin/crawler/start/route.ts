import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const CRAWLER_API_URL  = process.env.CRAWLER_API_URL  || ''
  const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET || ''

  // Check for admin session cookie
  const sessionCookie = req.cookies.get('admin_session')
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )

  const formData = await req.formData()
  const city     = (formData.get('city')     as string) || 'Austin'
  const state    = (formData.get('state')    as string) || 'TX'
  const industry = (formData.get('industry') as string) || 'Restaurants'
  const limit    = parseInt((formData.get('limit') as string) || '100')
  const maxPages = Math.ceil(limit / 20) // ~20 results per YP page

  try {
    // Always write a tracking record to Supabase
    const { data: dbJob, error: dbErr } = await supabase
      .from('crawl_jobs')
      .insert({
        city,
        state,
        industry,
        status: 'pending',
      })
      .select()
      .single()

    if (dbErr) throw new Error(dbErr.message)

    // If the crawler service is deployed, delegate to it
    if (CRAWLER_API_URL) {
      const res = await fetch(`${CRAWLER_API_URL}/jobs`, {
        method:  'POST',
        headers: {
          'Content-Type':    'application/json',
          'x-admin-secret':  ADMIN_API_SECRET,
        },
        body: JSON.stringify({ category: industry, city, state, maxPages }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Crawler service error')
    }

    // Redirect back to crawler admin page with success
    const url = new URL('/admin/crawler', req.url)
    url.searchParams.set('success', '1')
    return NextResponse.redirect(url, 303)
  } catch (err: any) {
    const url = new URL('/admin/crawler', req.url)
    url.searchParams.set('error', err.message)
    return NextResponse.redirect(url, 303)
  }
}
