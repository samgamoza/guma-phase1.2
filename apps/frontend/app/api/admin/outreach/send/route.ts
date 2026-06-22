import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/admin/outreach/send
 *
 * Manual outreach trigger (no auto-send during development).
 * Forwards to the outreach service API, which enqueues the records onto the
 * real worker — routing each lead to email (Resend) or SMS (Twilio).
 *
 * Form actions:
 *   action=send_all                  → enqueue every pending record
 *   action=send_one & outreach_id=…  → enqueue a single record
 */
const OUTREACH_API_URL = process.env.OUTREACH_API_URL || ''
const ADMIN_API_SECRET = process.env.ADMIN_API_SECRET || ''

function redirectBack(req: NextRequest, params: Record<string, string>) {
  const url = new URL('/admin/outreach', req.url)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return NextResponse.redirect(url, 303)
}

export async function POST(req: NextRequest) {
  // Auth: match the dev-bypass behaviour used by other admin routes
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev && !req.cookies.get('admin_session')?.value) {
    return redirectBack(req, { error: 'Unauthorized — please log in' })
  }

  if (!OUTREACH_API_URL) {
    return redirectBack(req, { error: 'OUTREACH_API_URL not set — start the outreach-api service first.' })
  }

  const form     = await req.formData()
  const action   = (form.get('action') as string) || 'send_all'
  const outreachId = (form.get('outreach_id') as string) || ''

  try {
    const endpoint = action === 'send_one' ? '/send' : '/send-pending'
    const body     = action === 'send_one' ? { outreachId } : { limit: 200 }

    const res = await fetch(`${OUTREACH_API_URL}${endpoint}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_API_SECRET },
      body:    JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Outreach service error')

    const msg = action === 'send_one'
      ? 'Outreach queued for 1 lead'
      : `Outreach queued for ${data.enqueued} pending lead${data.enqueued === 1 ? '' : 's'}`
    return redirectBack(req, { success: msg })
  } catch (err: any) {
    return redirectBack(req, { error: err.message })
  }
}
