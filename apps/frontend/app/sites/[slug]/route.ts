import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = getServiceClient()

  const { data: site } = await supabase
    .from('websites')
    .select('html_content, status')
    .eq('slug', params.slug)
    .single()

  if (!site?.html_content) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Increment view counter (fire and forget)
  supabase.rpc('increment_site_views', { site_slug: params.slug }).then(() => {}).catch(() => {})

  return new NextResponse(site.html_content, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  })
}
