import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'AI rewrite requires Pro plan upgrade' }, { status: 403 })
}
