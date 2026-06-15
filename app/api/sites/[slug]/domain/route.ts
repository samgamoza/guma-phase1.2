import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { domain } = await req.json()
  if (!domain) return NextResponse.json({ error: 'Missing domain' }, { status: 400 })

  // Sanitise
  const clean = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '')

  const { error } = await supabase
    .from('websites')
    .update({ custom_domain: clean })
    .eq('slug', params.slug)
    .eq('claimed_by', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // In production: trigger Cloudflare custom domain provisioning here
  // await cloudflare.addCustomHostname(clean)

  return NextResponse.json({ success: true, domain: clean })
}
