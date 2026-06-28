import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

const GENERATOR_API_URL = process.env.GENERATOR_API_URL || ''
const ADMIN_API_SECRET  = process.env.ADMIN_API_SECRET  || ''

export async function POST(req: NextRequest) {
  // Dev bypass
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
        const url = new URL('/admin/test-outreach', req.url)
        url.searchParams.set('error', 'Unauthorized')
        return NextResponse.redirect(url, 303)
      }
    }
  }

  const formData = await req.formData()
  const emailsRaw = (formData.get('emails') as string) || ''
  const limit     = parseInt((formData.get('limit') as string) || '5')

  try {
    if (!GENERATOR_API_URL) {
      const url = new URL('/admin/test-outreach', req.url)
      url.searchParams.set('error', 'GENERATOR_API_URL not set')
      return NextResponse.redirect(url, 303)
    }

    // Parse emails (comma or newline separated)
    const emails = emailsRaw
      .split(/[\n,]+/)
      .map(e => e.trim())
      .filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))

    if (emails.length === 0) {
      const url = new URL('/admin/test-outreach', req.url)
      url.searchParams.set('error', 'No valid emails provided')
      return NextResponse.redirect(url, 303)
    }

    // Trigger generation
    const genRes = await fetch(`${GENERATOR_API_URL}/jobs`, {
      method:  'POST',
      headers: {
        'Content-Type':   'application/json',
        'x-admin-secret': ADMIN_API_SECRET,
      },
      body: JSON.stringify({ limit }),
    })

    const genResult = await genRes.json()
    if (!genRes.ok) throw new Error(genResult.error || 'Generator error')

    // Create test outreach records with provided emails
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { persistSession: false } }
    )

    // Get most recently generated sites
    const { data: sites } = await supabase
      .from('websites')
      .select('id')
      .eq('status', 'generated')
      .order('generated_at', { ascending: false })
      .limit(limit)

    if (!sites || sites.length === 0) {
      const url = new URL('/admin/test-outreach', req.url)
      url.searchParams.set('error', `Generation queued but no sites available yet. Wait a moment and retry.`)
      return NextResponse.redirect(url, 303)
    }

    // Create outreach records for test emails (cycling through generated sites)
    const outreachRecords = emails.slice(0, sites.length).map((email, i) => ({
      website_id: sites[i].id,
      to_email: email,
      status: 'pending',
      created_at: new Date().toISOString(),
    }))

    const { data: insertedRecords, error: insertError } = await supabase
      .from('outreach')
      .insert(outreachRecords)

    if (insertError) throw insertError

    const url = new URL('/admin/test-outreach', req.url)
    url.searchParams.set('success', `${insertedRecords?.length || outreachRecords.length} test emails queued for ${limit} generated sites`)
    return NextResponse.redirect(url, 303)
  } catch (err: any) {
    const url = new URL('/admin/test-outreach', req.url)
    url.searchParams.set('error', err.message)
    return NextResponse.redirect(url, 303)
  }
}
