import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await request.json()
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  // Check site exists and isn't already claimed by someone else
  const { data: site } = await supabase
    .from('websites')
    .select('id, status, claimed_by')
    .eq('slug', slug)
    .single()

  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  if (site.claimed_by && site.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Already claimed by another user' }, { status: 409 })
  }

  // Claim it
  const { error } = await supabase
    .from('websites')
    .update({
      claimed_by: user.id,
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', site.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update outreach record
  await supabase
    .from('outreach')
    .update({ status: 'claimed' })
    .eq('website_id', site.id)

  return NextResponse.json({ success: true, websiteId: site.id })
}
