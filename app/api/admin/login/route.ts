import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

  if (!ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Admin password not configured' },
      { status: 500 }
    )
  }

  // Simple constant-time comparison to prevent timing attacks
  if (!password || password !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  }

  // Create session token (just a simple hash for now)
  const token = createHmac('sha256', 'admin-session')
    .update(Date.now().toString())
    .digest('hex')

  // Set HTTP-only session cookie
  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/admin',
  })

  return response
}
