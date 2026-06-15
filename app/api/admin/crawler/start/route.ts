import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const CRAWLER_API_URL  = process.env.CRAWLER_API_URL  || ''
  const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET || ''

  // Check for admin session cookie
  const sessionCookie = req.cookies.get('admin_session')
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const city     = (formData.get('city')     as string) || 'Austin'
  const state    = (formData.get('state')    as string) || 'TX'
  const industry = (formData.get('industry') as string) || 'Restaurants'
  const source   = (formData.get('source')   as string) || 'yellowpages'
  const limit    = parseInt((formData.get('limit') as string) || '100')
  const maxPages = Math.ceil(limit / 20)

  const back = (params: Record<string, string>) => {
    const url = new URL('/admin/crawler', req.url)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return NextResponse.redirect(url, 303)
  }

  // The crawler service owns the crawl_jobs record and the BullMQ queue.
  if (!CRAWLER_API_URL) {
    return back({ error: 'CRAWLER_API_URL not set — deploy the crawler service first.' })
  }

  try {
    const res = await fetch(`${CRAWLER_API_URL}/jobs`, {
      method:  'POST',
      headers: {
        'Content-Type':   'application/json',
        'x-admin-secret': ADMIN_API_SECRET,
      },
      body: JSON.stringify({ category: industry, city, state, maxPages, source }),
    })
    const result = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(result.error || `Crawler service error (${res.status})`)

    return back({ success: '1' })
  } catch (err: any) {
    return back({ error: `Could not reach crawler service: ${err.message}` })
  }
}
