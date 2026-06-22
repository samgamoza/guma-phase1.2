import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const GENERATOR_API_URL = process.env.GENERATOR_API_URL || ''
const ADMIN_API_SECRET  = process.env.ADMIN_API_SECRET  || ''

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )

  try {
    if (!GENERATOR_API_URL) {
      const url = new URL('/admin/generator', req.url)
      url.searchParams.set('error', 'GENERATOR_API_URL not set — start the generator service first.')
      return NextResponse.redirect(url, 303)
    }

    // Get sites that can be regenerated (not claimed/published)
    const { data: sites, error: fetchErr } = await supabase
      .from('websites')
      .select('id, business_id')
      .in('status', ['generated', 'failed', 'pending'])

    if (fetchErr) throw new Error(fetchErr.message)

    const websiteIds  = (sites ?? []).map((s: any) => s.id)
    const siteBusinessIds = new Set((sites ?? []).map((s: any) => s.business_id).filter(Boolean))

    // Also get all businesses that have no website at all
    const { data: allBusinesses, error: bizErr } = await supabase
      .from('businesses')
      .select('id')
    if (bizErr) throw new Error(bizErr.message)

    const { data: existingWebsites } = await supabase
      .from('websites')
      .select('business_id')
    const existingBusinessIds = new Set((existingWebsites ?? []).map((w: any) => w.business_id))

    const businessesWithoutSites = (allBusinesses ?? [])
      .map((b: any) => b.id)
      .filter((id: string) => !existingBusinessIds.has(id))

    // Combine: businesses from deletable sites + businesses with no site
    const businessIds = [...new Set([...siteBusinessIds, ...businessesWithoutSites])]

    if (businessIds.length === 0) {
      const url = new URL('/admin/generator', req.url)
      url.searchParams.set('error', 'No businesses to regenerate')
      return NextResponse.redirect(url, 303)
    }

    // Delete outreach + websites for regeneratable sites
    if (websiteIds.length > 0) {
      await supabase.from('outreach').delete().in('website_id', websiteIds)
      await supabase.from('websites').delete().in('id', websiteIds)
    }

    // Unlock all target businesses
    await supabase.from('businesses').update({ site_generated: false }).in('id', businessIds)

    // Force-batch: removes old completed BullMQ jobs then re-queues
    const res = await fetch(`${GENERATOR_API_URL}/jobs/force-batch`, {
      method:  'POST',
      headers: {
        'Content-Type':   'application/json',
        'x-admin-secret': ADMIN_API_SECRET,
      },
      body: JSON.stringify({ businessIds }),
    })

    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Generator service error')

    const url = new URL('/admin/generator', req.url)
    url.searchParams.set(
      'success',
      `${websiteIds.length} sites cleared — ${result.enqueued} jobs queued for regeneration`
    )
    return NextResponse.redirect(url, 303)
  } catch (err: any) {
    const url = new URL('/admin/generator', req.url)
    url.searchParams.set('error', err.message)
    return NextResponse.redirect(url, 303)
  }
}
