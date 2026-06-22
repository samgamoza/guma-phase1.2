import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
}

// GET /api/admin/crawler/targets — list all targets
export async function GET() {
  const db = getDb()
  const { data, error } = await db
    .from('crawl_targets')
    .select('*')
    .order('priority', { ascending: true })
    .order('city', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/admin/crawler/targets — add a new target
export async function POST(req: Request) {
  const body = await req.json()
  const { city, state, category, source = 'serper', priority = 5, cooldown_days = 30 } = body

  if (!city || !state || !category) {
    return NextResponse.json({ error: 'city, state, and category are required' }, { status: 400 })
  }

  const db = getDb()
  const { data, error } = await db
    .from('crawl_targets')
    .insert({ city, state, category, source, priority, cooldown_days, status: 'active' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
