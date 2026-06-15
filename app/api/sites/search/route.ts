import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q    = searchParams.get('q')?.trim()
  const city = searchParams.get('city')?.trim()

  if (!q) return NextResponse.json({ businesses: [] })

  const supabase = createServerSupabaseClient()

  let query = supabase
    .from('businesses')
    .select(`
      id, name, category, city, phone, address, slug,
      websites(status)
    `)
    .ilike('name', `%${q}%`)
    .limit(10)

  if (city) query = query.ilike('city', `%${city}%`)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = (data || []).map((b: any) => ({
    id: b.id,
    name: b.name,
    category: b.category,
    city: b.city,
    phone: b.phone,
    address: b.address,
    slug: b.slug,
    website_status: b.websites?.[0]?.status ?? null,
  }))

  return NextResponse.json({ businesses: results })
}
