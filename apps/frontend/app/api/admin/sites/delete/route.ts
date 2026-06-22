import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
  // Accept admin_session cookie OR active Supabase session
  const adminSession = req.cookies.get('admin_session')?.value
  if (!adminSession) {
    const anonClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => req.cookies.get(name)?.value, set: () => {}, remove: () => {} } }
    )
    const { data: { user } } = await anonClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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

  // Look up the business_id before deleting
  const { data: siteData } = await supabase
    .from('websites')
    .select('business_id')
    .eq('id', websiteId)
    .single()

  // Delete outreach records first (FK constraint)
  await supabase.from('outreach').delete().eq('website_id', websiteId)

  // Delete the website
  const { error } = await supabase.from('websites').delete().eq('id', websiteId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Reset the business so it can be re-generated
  if (siteData?.business_id) {
    await supabase
      .from('businesses')
      .update({ site_generated: false })
      .eq('id', siteData.business_id)
  }

  const url = new URL('/admin/sites', req.url)
  url.searchParams.set('success', 'Site deleted — business queued for re-generation')
  return NextResponse.redirect(url, 303)
}
