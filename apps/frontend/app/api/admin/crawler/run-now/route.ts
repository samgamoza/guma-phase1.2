import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * POST /api/admin/crawler/run-now
 *
 * Triggers an immediate crawl batch by calling the crawler API directly.
 * Also supports toggling scheduler enabled/disabled and updating interval.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )

  // Handle scheduler config updates (toggle, interval change)
  if (body.action === 'toggle' || body.action === 'set_interval' || body.action === 'set_batch') {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.action === 'toggle')       patch.enabled = body.enabled
    if (body.action === 'set_interval') patch.interval_days = body.interval_days
    if (body.action === 'set_batch')    patch.batch_size = body.batch_size

    const { error } = await db.from('scheduler_config').update(patch).eq('id', 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // action === 'run_one' — manual one-off crawl from the form
  if (body.action === 'run_one') {
    const crawlerApiUrl = process.env.CRAWLER_API_URL || 'http://localhost:3001'

    // Check if it's a custom URL crawl or standard source crawl
    if (body.customUrl) {
      // Custom directory URL mode
      const res = await fetch(`${crawlerApiUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': process.env.ADMIN_API_SECRET || '',
        },
        body: JSON.stringify({
          source: 'custom',
          customUrl: body.customUrl,
          category: body.category,
          location: body.location,
          country: body.country,
          state: body.state,
          scopeType: body.scopeType || 'limited',
          scopeLimit: body.scopeLimit || 100,
        }),
      })
      const data = await res.json()
      if (!res.ok) return NextResponse.json({ error: data.error || data.message }, { status: 500 })
      return NextResponse.json({
        ok: true,
        jobId: data.jobId,
        message: `Crawl enqueued for ${body.category} from ${new URL(body.customUrl).hostname}`
      })
    } else {
      // Standard sources mode
      const res = await fetch(`${crawlerApiUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': process.env.ADMIN_API_SECRET || '',
        },
        body: JSON.stringify({
          category: body.category,
          city: body.city,
          state: body.state,
          country: body.country,
          source: body.source || 'serper',
          maxPages: body.maxPages || 2,
        }),
      })
      const data = await res.json()
      if (!res.ok) return NextResponse.json({ error: data.error || data.message }, { status: 500 })
      return NextResponse.json({ ok: true, jobId: data.jobId, message: `Crawl enqueued for ${body.category} / ${body.city}, ${body.state}` })
    }
  }

  // action === 'run' or default — trigger immediate batch
  const { data: config } = await db.from('scheduler_config').select('batch_size').eq('id', 1).single()
  const batchSize = config?.batch_size || 3

  const now = new Date().toISOString()
  const { data: targets, error: targetsErr } = await db
    .from('crawl_targets')
    .select('*')
    .eq('status', 'active')
    .or(`next_crawl_at.is.null,next_crawl_at.lte.${now}`)
    .order('priority', { ascending: true })
    .limit(batchSize)

  if (targetsErr) return NextResponse.json({ error: targetsErr.message }, { status: 500 })
  if (!targets || targets.length === 0) {
    return NextResponse.json({ enqueued: 0, message: 'No targets due for crawling' })
  }

  const crawlerApiUrl = process.env.CRAWLER_API_URL || 'http://localhost:3001'
  const results = []

  for (const target of targets) {
    try {
      const res = await fetch(`${crawlerApiUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': process.env.ADMIN_API_SECRET || '',
        },
        body: JSON.stringify({
          category: target.category,
          city: target.city,
          state: target.state,
          source: target.source || 'serper',
          maxPages: 5,
          scheduledTargetId: target.id,
        }),
      })
      const data = await res.json()
      results.push({ target: `${target.category}/${target.city}`, ...data })
    } catch (err: any) {
      results.push({ target: `${target.category}/${target.city}`, error: err.message })
    }
  }

  return NextResponse.json({ enqueued: results.filter(r => !r.error).length, results })
}
