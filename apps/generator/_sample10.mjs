/**
 * One-off: regenerate a SAMPLE of 10 sites across 10 distinct industries using the
 * upgraded pipeline (cached content_spec/business_dna → new templates → validate&refine),
 * and upsert them back to Supabase so they're viewable in the app at /sites/<slug>.
 * Does NOT touch the other ~950 sites. Run: node _sample10.mjs
 */
import 'dotenv/config'
import { getSupabase, getBusinessById, upsertWebsite } from './src/db/client.js'
import { generateFromTemplate } from './src/generator/templateEngine.js'
import { validateAndRefine } from './src/generator/refine.js'
import { resolveCategory } from './src/templates/categories.js'
import { businessDnaToSpec } from './src/intelligence/dnaAdapter.js'

const TARGET_CATEGORIES = [
  'restaurant', 'salon', 'trades', 'medical', 'legal',
  'retail', 'gym', 'photography', 'bakeshop', 'catering',
  'petcare', 'gadgetrepair', 'laundry',
]

async function pickSample() {
  // Pull a batch of businesses and bucket by RESOLVED category (the keyword
  // resolver, not the generic free-text "category" column). Prefer ones that
  // already have contact info so the rendered pages look complete.
  const { data, error } = await getSupabase()
    .from('businesses')
    .select('id, name, slug, category, city, country, phone, email, address, raw_data, content_spec, business_dna')
    .order('id', { ascending: false })
    .limit(3000)
  if (error) throw new Error(`businesses query failed: ${error.message}`)

  const byCat = new Map()
  for (const b of data || []) {
    if (!b.slug) continue
    const { key } = resolveCategory(b)
    if (!TARGET_CATEGORIES.includes(key)) continue
    if (byCat.has(key)) continue            // first hit per category wins
    byCat.set(key, b)
  }
  const found = [...byCat.keys()]
  const missing = TARGET_CATEGORIES.filter(c => !byCat.has(c))
  console.log(`Scanned ${data?.length || 0} businesses · industries found: ${found.join(', ')}`)
  if (missing.length) console.log(`(no businesses resolve to: ${missing.join(', ')})\n`)
  return [...byCat.values()].slice(0, 10)
}

function specFor(business) {
  if (business.content_spec) return { spec: business.content_spec, source: 'content_spec' }
  if (business.business_dna) return { spec: businessDnaToSpec(business.business_dna, business), source: 'business_dna' }
  return { spec: null, source: 'fallback' }
}

async function main() {
  const sample = await pickSample()
  if (!sample.length) { console.log('No businesses matched the target categories.'); process.exit(1) }

  const rows = []
  for (const b of sample) {
    const business = await getBusinessById(b.id)   // full row
    const { key, config } = resolveCategory(business)
    const { spec, source } = specFor(business)

    const result = await generateFromTemplate(business, key, config, spec)
    const { html, report } = validateAndRefine({ html: result.html, business, spec })

    await upsertWebsite({
      businessId: result.businessId,
      slug: result.slug,
      html,
      categoryKey: result.categoryKey,
      theme: result.theme,
      sections: result.sections,
    })

    rows.push({ name: business.name, cat: key, spec: source, score: report.score, slug: result.slug })
    console.log(`✓ ${key.padEnd(12)} ${business.name}`)
  }

  console.log('\n  Industry      Spec           Score  Site URL')
  console.log('  ' + '-'.repeat(78))
  for (const r of rows) {
    console.log('  ' + r.cat.padEnd(13) + ' ' + r.spec.padEnd(14) + ' ' + String(r.score).padStart(4) + '   /sites/' + r.slug)
  }
  console.log(`\n  ✓ Regenerated ${rows.length} sites. View the list at /admin/sites (top of list) or open any /sites/<slug> above.`)
  process.exit(0)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
