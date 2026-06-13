import { NextRequest, NextResponse } from 'next/server'

const GENERATOR_API_URL = process.env.GENERATOR_API_URL || ''
const ADMIN_API_SECRET  = process.env.ADMIN_API_SECRET  || ''

export async function POST(req: NextRequest) {
  // Check for admin session cookie
  const sessionCookie = req.cookies.get('admin_session')
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const city     = (formData.get('city')     as string) || ''
  const industry = (formData.get('industry') as string) || ''
  const limit    = parseInt((formData.get('limit') as string) || '25')

  try {
    if (!GENERATOR_API_URL) {
      return NextResponse.json(
        { error: 'GENERATOR_API_URL not set — deploy the generator service first.' },
        { status: 503 }
      )
    }

    const res = await fetch(`${GENERATOR_API_URL}/jobs`, {
      method:  'POST',
      headers: {
        'Content-Type':   'application/json',
        'x-admin-secret': ADMIN_API_SECRET,
      },
      body: JSON.stringify({ city, industry, limit }),
    })

    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Generator service error')

    const url = new URL('/admin/generator', req.url)
    url.searchParams.set('success', `${result.enqueued} jobs queued`)
    return NextResponse.redirect(url, 303)
  } catch (err: any) {
    const url = new URL('/admin/generator', req.url)
    url.searchParams.set('error', err.message)
    return NextResponse.redirect(url, 303)
  }
}
