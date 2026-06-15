import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// ── Column maps per source format ─────────────────────────────────────────────

const MAPS: Record<string, (row: any) => any> = {
  brightdata: (r) => ({
    name:        r.name?.trim(),
    phone:       r.phone || null,
    email:       null,
    address:     r.full_address || r.address || null,
    city:        r.city || null,
    country:     r.country_code || 'US',
    category:    r.category || r.type || null,
    has_website: Boolean(r.site || r.website),
    source_dir:  'brightdata',
    source_url:  r.google_id ? `https://maps.google.com/?cid=${r.google_id}` : null,
    raw_data: {
      state:        r.state || null,
      zip:          r.zip_code || r.postal_code || null,
      description:  r.description || null,
      rating:       r.rating?.toString() || null,
      review_count: r.reviews || r.review_count || 0,
      website_url:  r.site || r.website || null,
      google_id:    r.google_id || null,
      latitude:     r.latitude || null,
      longitude:    r.longitude || null,
    },
  }),

  apify: (r) => ({
    name:        (r.title || r.name)?.trim(),
    phone:       r.phone || r.phoneNumber || null,
    email:       null,
    address:     r.address || r.formatted_address || null,
    city:        r.city || null,
    country:     'US',
    category:    r.categoryName || r.category || null,
    has_website: Boolean(r.website),
    source_dir:  'apify',
    source_url:  r.url || null,
    raw_data: {
      state:        r.state || null,
      zip:          r.postalCode || r.postal_code || null,
      description:  r.description || null,
      rating:       r.totalScore?.toString() || r.rating?.toString() || null,
      review_count: r.reviewsCount || r.review_count || 0,
      website_url:  r.website || null,
      place_id:     r.placeId || null,
    },
  }),

  generic: (r) => ({
    name:        (r.name || r.business_name || r.title)?.trim(),
    phone:       r.phone || r.telephone || r.phoneNumber || null,
    email:       r.email || null,
    address:     r.address || r.full_address || r.formatted_address || null,
    city:        r.city || r.locality || null,
    country:     r.country || r.country_code || 'US',
    category:    r.category || r.type || r.industry || null,
    has_website: Boolean(r.website || r.site || r.url),
    source_dir:  'manual',
    source_url:  r.url || r.source_url || null,
    raw_data:    r,
  }),
}

// ── Slugify helper (no extra dep) ─────────────────────────────────────────────

function toSlug(name: string, city: string) {
  return `${name}-${city || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 120)
}

// ── Simple CSV parser ─────────────────────────────────────────────────────────

function parseCSV(text: string): any[] {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []

  // Handle quoted fields
  const splitLine = (line: string) => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim()); current = ''
      } else {
        current += ch
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'))
  return lines.slice(1).map((line) => {
    const values = splitLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get('admin_session')
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file   = formData.get('file') as File
  const source = (formData.get('source') as string) || 'generic'

  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const mapper = MAPS[source] || MAPS.generic
  const text   = await file.text()

  // Parse file
  let rows: any[]
  try {
    if (file.name.endsWith('.json') || text.trimStart().startsWith('[') || text.trimStart().startsWith('{')) {
      const parsed = JSON.parse(text)
      rows = Array.isArray(parsed) ? parsed : [parsed]
    } else {
      rows = parseCSV(text)
    }
  } catch (err: any) {
    return NextResponse.json({ error: `Parse error: ${err.message}` }, { status: 400 })
  }

  if (!rows.length) {
    return NextResponse.json({ error: 'File is empty or unreadable' }, { status: 400 })
  }

  // Map rows to DB schema
  const businesses = rows
    .map((r) => {
      try {
        const mapped = mapper(r)
        if (!mapped.name) return null
        return {
          ...mapped,
          slug:       toSlug(mapped.name, mapped.city || ''),
          crawled_at: new Date().toISOString(),
        }
      } catch {
        return null
      }
    })
    .filter(Boolean)

  if (!businesses.length) {
    return NextResponse.json({ error: 'No valid rows found after mapping. Check your file format.' }, { status: 400 })
  }

  // Upsert in batches of 100
  let imported = 0
  let skipped  = 0
  const errors: string[] = []

  for (let i = 0; i < businesses.length; i += 100) {
    const batch = businesses.slice(i, i + 100)
    const { data, error } = await supabase
      .from('businesses')
      .upsert(batch, { onConflict: 'slug', ignoreDuplicates: false })
      .select('id')

    if (error) {
      errors.push(`Batch ${Math.floor(i / 100) + 1}: ${error.message}`)
      skipped += batch.length
    } else {
      imported += data?.length || 0
    }
  }

  return NextResponse.json({
    ok: true,
    total:    rows.length,
    mapped:   businesses.length,
    imported,
    skipped,
    errors:   errors.slice(0, 5),
  })
}
