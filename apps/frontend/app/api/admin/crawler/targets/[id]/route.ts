import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
}

// PATCH /api/admin/crawler/targets/[id] — update status, cooldown, priority
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const allowed = ['status', 'priority', 'cooldown_days', 'consecutive_empty_runs']
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) patch[key] = body[key]
  }
  // Reset saturation when admin manually reactivates
  if (patch.status === 'active') patch.consecutive_empty_runs = 0

  const db = getDb()
  const { data, error } = await db
    .from('crawl_targets')
    .update(patch)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/admin/crawler/targets/[id] — remove target
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const db = getDb()
  const { error } = await db.from('crawl_targets').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
