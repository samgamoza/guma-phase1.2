import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('websites')
    .select('id, slug, plan, status, html_content, custom_domain, businesses(*)')
    .eq('slug', params.slug)
    .eq('claimed_by', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id:            data.id,
    slug:          data.slug,
    plan:          data.plan,
    status:        data.status,
    html_content:  data.html_content,
    custom_domain: data.custom_domain,
    business:      data.businesses,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership and plan
  const { data: site } = await supabase
    .from('websites')
    .select('id, plan, html_content, business_id')
    .eq('slug', params.slug)
    .eq('claimed_by', user.id)
    .single()

  if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (site.plan === 'free') return NextResponse.json({ error: 'Pro plan required' }, { status: 403 })

  const { fields } = await req.json()

  // Update business record
  if (fields) {
    await supabase
      .from('businesses')
      .update({
        name:    fields.name,
        phone:   fields.phone,
        email:   fields.email,
        address: fields.address,
        raw_data: {
          tagline:     fields.tagline,
          hours:       fields.hours,
          description: fields.description,
        },
      })
      .eq('id', site.business_id)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('websites')
    .update({ status: 'deleted' })
    .eq('slug', params.slug)
    .eq('claimed_by', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
