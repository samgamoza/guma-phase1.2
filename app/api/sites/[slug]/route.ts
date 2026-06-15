import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('websites')
    .select('*, businesses(name, category, city, phone, email, address)')
    .eq('slug', params.slug)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const biz = data.businesses as any

  return NextResponse.json({
    id:               data.id,
    businessName:     biz?.name ?? params.slug,
    businessCategory: biz?.category ?? null,
    businessCity:     biz?.city ?? null,
    businessPhone:    biz?.phone ?? null,
    businessEmail:    biz?.email ?? null,
    businessAddress:  biz?.address ?? null,
    siteSlug:         data.slug,
    websiteId:        data.id,
    plan:             data.plan,
    status:           data.status,
    htmlContent:      data.html_content,
    claimedBy:        data.claimed_by,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { htmlContent, status } = await request.json()

  const { data: site, error: fetchError } = await supabase
    .from('websites')
    .select('id, claimed_by, plan')
    .eq('slug', params.slug)
    .single()

  if (fetchError || !site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  }

  if (site.claimed_by !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (site.plan === 'free') {
    return NextResponse.json({ error: 'Upgrade to Pro to edit' }, { status: 403 })
  }

  const { error } = await supabase
    .from('websites')
    .update({ html_content: htmlContent, status: status || 'published' })
    .eq('slug', params.slug)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, slug: params.slug })
}
