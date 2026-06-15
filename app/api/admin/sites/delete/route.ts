import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
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

  const formData  = await req.formData()
  const websiteId = formData.get('website_id') as string
  if (!websiteId) return NextResponse.json({ error: 'Missing website_id' }, { status: 400 })

  // Refuse to delete claimed or published sites (safety guard)
  const { data: site } = await supabase
    .from('websites')
    .select('status, claimed_by')
    .eq('id', websiteId)
    .single()

  if (site?.claimed_by) {
    return NextResponse.json({ error: 'Cannot delete a claimed site' }, { status: 409 })
  }

  // Delete outreach records first (FK constraint)
  await supabase.from('outreach').delete().eq('website_id', websiteId)

  // Delete the website
  const { error } = await supabase.from('websites').delete().eq('id', websiteId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const url = new URL('/admin/sites', req.url)
  url.searchParams.set('success', 'Site deleted')
  return NextResponse.redirect(url, 303)
}
