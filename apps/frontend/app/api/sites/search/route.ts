import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

// ─── Category Resolver ─────────────────────────────────────────────────────

function resolveCategory(types: string[]): string {
  const t = types.map(x => x.toLowerCase()).join(' ')
  if (t.includes('restaurant') || t.includes('food') || t.includes('meal') || t.includes('cafe') || t.includes('bakery')) return 'Restaurant / Food & Dining'
  if (t.includes('salon') || t.includes('beauty') || t.includes('hair') || t.includes('spa') || t.includes('nail')) return 'Salon / Beauty & Wellness'
  if (t.includes('plumber') || t.includes('electrician') || t.includes('contractor') || t.includes('repair') || t.includes('hvac') || t.includes('roofing')) return 'Trades / Home Services'
  if (t.includes('doctor') || t.includes('medical') || t.includes('dental') || t.includes('clinic') || t.includes('pharmacy') || t.includes('hospital')) return 'Medical / Dental / Health'
  if (t.includes('lawyer') || t.includes('legal') || t.includes('attorney') || t.includes('accountant') || t.includes('finance')) return 'Legal / Financial'
  if (t.includes('store') || t.includes('shop') || t.includes('retail') || t.includes('boutique')) return 'Retail / Shop'
  if (t.includes('auto') || t.includes('car') || t.includes('vehicle') || t.includes('mechanic')) return 'Automotive'
  return 'Local Business'
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ─── Live Web Search via DuckDuckGo Instant Answers ──────────────────────────

async function searchDuckDuckGo(q: string): Promise<any[]> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q + ' business')}&format=json&no_html=1&skip_disambig=1`
    const res = await fetch(url, { headers: { 'User-Agent': 'Guma-AI/1.0' }, signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const data = await res.json()

    const results: any[] = []

    // Check Abstract (main result)
    if (data.AbstractText && data.AbstractText.length > 20 && data.AbstractSource) {
      results.push({
        name: data.Heading || q,
        category: 'Local Business',
        city: '',
        phone: '',
        address: data.AbstractURL || '',
        source: 'duckduckgo',
        description: data.AbstractText?.substring(0, 200),
      })
    }

    // Related Topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            name: topic.Text.split(' - ')[0] || q,
            category: 'Local Business',
            city: '',
            phone: '',
            address: topic.FirstURL,
            source: 'duckduckgo_related',
            description: topic.Text,
          })
        }
      }
    }

    return results
  } catch {
    return []
  }
}

// ─── Live Search via Open Street Map Nominatim ───────────────────────────────

async function searchNominatim(q: string, city: string): Promise<any[]> {
  try {
    const locationQuery = city ? `${q} ${city}` : q
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationQuery)}&format=jsonv2&limit=8&addressdetails=1&extratags=1`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Guma-AI/1.0 (business-discovery-platform)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return []
    const data = await res.json()

    return (data || []).map((item: any) => {
      const addr = item.address || {}
      const extratags = item.extratags || {}
      return {
        name: item.name || item.display_name?.split(',')[0] || q,
        category: resolveCategory([item.type || '', item.class || '']),
        city: addr.city || addr.town || addr.village || addr.county || city || '',
        country: addr.country_code?.toUpperCase() || null,
        phone: extratags.phone || extratags['contact:phone'] || '',
        address: [addr.road, addr.house_number, addr.city || addr.town].filter(Boolean).join(', '),
        source: 'nominatim',
        osm_type: item.osm_type,
        osm_id: item.osm_id,
        lat: item.lat,
        lon: item.lon,
        display_name: item.display_name,
      }
    })
  } catch {
    return []
  }
}

// ─── Trigger Site Generation ─────────────────────────────────────────────────

async function triggerGeneration(businessId: string): Promise<void> {
  const generatorUrl = process.env.GENERATOR_API_URL
  if (!generatorUrl) return // generator not wired up in this env — skip silently
  try {
    await fetch(`${generatorUrl.replace(/\/$/, '')}/jobs/single`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': process.env.GENERATOR_API_SECRET || '',
      },
      body: JSON.stringify({ businessId }),
      signal: AbortSignal.timeout(3000),
    })
  } catch {
    // Fire-and-forget — don't block the search response
  }
}

// ─── Upsert Live Results Into Supabase ───────────────────────────────────────

async function upsertLiveResults(liveResults: any[]): Promise<any[]> {
  if (!liveResults.length) return []
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    const insertedResults: any[] = []

    for (const r of liveResults) {
      if (!r.name || r.name.trim().length < 2) continue

      const baseSlug = slugify(`${r.name}-${r.city || 'local'}`)
      const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 5)}`

      // Check if similar name already exists
      const { data: existing } = await supabase
        .from('businesses')
        .select('id, name, slug, city, phone, address, category, websites(status)')
        .ilike('name', `%${r.name.substring(0, 20)}%`)
        .limit(1)
        .single()

      if (existing) {
        insertedResults.push({
          id: existing.id,
          name: existing.name,
          category: existing.category,
          city: existing.city,
          phone: existing.phone,
          address: existing.address,
          slug: existing.slug,
          website_status: (existing as any).websites?.[0]?.status ?? null,
          source: 'db_match',
        })
        continue
      }

      // Insert new business
      const { data: newBiz } = await supabase
        .from('businesses')
        .insert({
          name: r.name,
          slug,
          category: r.category,
          phone: r.phone || null,
          address: r.address || null,
          city: r.city || null,
          country: r.country || null,
          source_dir: r.source || 'web_search',
          has_website: false,
          raw_data: { source: r.source, description: r.description, lat: r.lat, lon: r.lon },
        })
        .select('id')
        .single()

      if (newBiz) {
        // Kick off site generation so the user finds a site when they return
        await triggerGeneration(newBiz.id)

        insertedResults.push({
          id: newBiz.id,
          name: r.name,
          category: r.category,
          city: r.city || '',
          phone: r.phone || '',
          address: r.address || '',
          slug,
          website_status: 'generating',
          source: r.source,
        })
      }
    }

    return insertedResults
  } catch (err) {
    console.error('upsertLiveResults error:', err)
    return []
  }
}

// ─── Main GET Handler ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q    = searchParams.get('q')?.trim()
  const city = searchParams.get('city')?.trim() || ''

  if (!q) return NextResponse.json({ businesses: [] })

  // 1. First try database
  const supabase = createServerSupabaseClient()

  let dbQuery = supabase
    .from('businesses')
    .select(`id, name, category, city, phone, address, slug, websites(status)`)
    .ilike('name', `%${q}%`)
    .limit(10)

  if (city) dbQuery = dbQuery.ilike('city', `%${city}%`)

  const { data: dbData, error: dbError } = await dbQuery

  const dbResults = (dbData || []).map((b: any) => ({
    id: b.id,
    name: b.name,
    category: b.category,
    city: b.city,
    phone: b.phone,
    address: b.address,
    slug: b.slug,
    website_status: b.websites?.[0]?.status ?? null,
    source: 'db',
  }))

  // 2. If DB has solid results, return immediately
  if (dbResults.length >= 3) {
    return NextResponse.json({ businesses: dbResults, source: 'db' })
  }

  // 3. Otherwise: Run live web search in parallel
  const [nominatimResults, ddgResults] = await Promise.allSettled([
    searchNominatim(q, city),
    searchDuckDuckGo(q),
  ])

  let liveResults = [
    ...(nominatimResults.status === 'fulfilled' ? nominatimResults.value : []),
    ...(ddgResults.status === 'fulfilled' ? ddgResults.value : []),
  ].filter(r => r.name && r.name.toLowerCase() !== 'wikipedia')

  // Fallback: if no external match, still let the user claim a site under the
  // exact name they typed — but never fabricate contact details.
  if (liveResults.length === 0 && q.length > 2) {
    liveResults.push({
      name: q,
      category: resolveCategory([q]),
      city: city || '',
      phone: '',
      address: '',
      source: 'user_entered',
    })
  }

  // 4. Upsert live results into DB
  const savedResults = await upsertLiveResults(liveResults.slice(0, 6))

  // 5. Merge DB + live results (dedup by slug)
  const allResultsMap = new Map()
  for (const r of [...dbResults, ...savedResults]) {
    if (!allResultsMap.has(r.slug)) {
      allResultsMap.set(r.slug, r)
    }
  }

  const finalResults = Array.from(allResultsMap.values()).slice(0, 10)

  return NextResponse.json({
    businesses: finalResults,
    source: finalResults.length > 0 ? (dbResults.length > 0 ? 'db+web' : 'web') : 'none',
  })
}
