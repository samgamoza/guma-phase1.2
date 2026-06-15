import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  // Check for admin session cookie
  const sessionCookie = req.cookies.get('admin_session')
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const RESEND_KEY   = process.env.RESEND_API_KEY || ''
  const SITE_BASE    = process.env.NEXT_PUBLIC_SITE_URL || 'https://guma.ai'
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )

  const formData  = await req.formData()
  const websiteId = formData.get('website_id') as string
  if (!websiteId) return NextResponse.json({ error: 'Missing website_id' }, { status: 400 })

  // Load website + business
  const { data: site } = await supabase
    .from('websites')
    .select('id, slug, business_id, businesses(name, city, category, email)')
    .eq('id', websiteId)
    .single()

  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  const biz = (site as any).businesses
  if (!biz?.email) return NextResponse.json({ error: 'Business has no email' }, { status: 400 })

  // Create/update outreach record
  const { data: outreach } = await supabase
    .from('outreach')
    .upsert({
      website_id:  websiteId,
      business_id: (site as any).business_id,
      to_email:    biz.email,
      status:      'pending',
    }, { onConflict: 'website_id' })
    .select()
    .single()

  const outreachId = (outreach as any)?.id || websiteId
  const slug       = (site as any).slug || websiteId
  const siteUrl    = `${SITE_BASE}/sites/${slug}`
  const claimUrl   = `${SITE_BASE}/claim/${slug}`

  // Build email
  const name = biz.name || 'your business'
  const subject = `${name} — your free website from Guma AI`
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{margin:0;padding:0;background:#f8f7f2;font-family:-apple-system,sans-serif}
.wrap{max-width:560px;margin:32px auto;background:#fff;border-radius:16px;border:1px solid #e5e3da}
.hd{background:#0f1117;padding:24px 32px;border-radius:16px 16px 0 0}
.logo{color:#fff;font-size:16px;font-weight:600}.logo span{color:#6c63ff}
.bd{padding:32px}p{margin:0 0 16px;color:#2c2c2c;font-size:15px;line-height:1.6}
.btn{display:inline-block;background:#6c63ff;color:#fff!important;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px}
.ft{padding:20px 32px;background:#fafaf8;border-radius:0 0 16px 16px}
.ft p{font-size:12px;color:#9c9889;margin:0 0 6px}.ft a{color:#6c63ff;text-decoration:none}
</style></head>
<body><div class="wrap">
<div class="hd"><div class="logo">Guma <span>AI</span></div></div>
<div class="bd">
<p>Hi there,</p>
<p>We noticed <strong>${name}</strong> doesn't have a website yet — so we built one for you, completely free.</p>
<p>Your site is ready at: <a href="${siteUrl}" style="color:#6c63ff">${siteUrl}</a></p>
<p style="text-align:center;margin:24px 0">
  <a href="${claimUrl}?ref=resend&oid=${outreachId}" class="btn">Claim my free site →</a>
</p>
<p style="font-size:13px;color:#6b6760">No credit card needed. The free site stays live forever. Reply with any questions.</p>
<p style="font-size:14px;color:#6b6760">— Jake at Guma AI</p>
</div>
<div class="ft">
<p>You're receiving this because ${name} appeared in a public directory without a website.</p>
<p><a href="${claimUrl}/unsubscribe?oid=${outreachId}">Unsubscribe</a></p>
</div>
</div>
<img src="${SITE_BASE}/api/outreach/open?oid=${outreachId}" width="1" height="1" style="display:none" alt="">
</body></html>`

  // Send via Resend
  if (!RESEND_KEY) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 503 })

  const resendRes = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'Jake <jake@guma.ai>',
      to:      [biz.email],
      subject,
      html,
    }),
  })

  if (!resendRes.ok) {
    const err = await resendRes.json()
    return NextResponse.json({ error: err.message || 'Resend failed' }, { status: 500 })
  }

  // Mark outreach as sent
  await supabase
    .from('outreach')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', outreachId)

  const url = new URL('/admin/sites', req.url)
  url.searchParams.set('success', 'Outreach sent')
  return NextResponse.redirect(url, 303)
}
