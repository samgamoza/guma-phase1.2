import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Tracking pixel — called when email is opened (1x1 transparent GIF)
export async function GET(request: NextRequest) {
  const oid = request.nextUrl.searchParams.get('oid')

  if (oid) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { persistSession: false } }
    )
    await supabase
      .from('outreach')
      .update({ status: 'opened', opened_at: new Date().toISOString() })
      .eq('id', oid)
      .eq('status', 'sent')  // only upgrade from sent → opened
      .catch(() => {})
  }

  // Return 1x1 transparent GIF
  const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
  return new NextResponse(gif, {
    headers: {
      'Content-Type':  'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
