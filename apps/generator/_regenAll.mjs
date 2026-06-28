/**
 * Regenerate ALL unclaimed ('generated') sites with the corrected pipeline:
 * fixed categorization (auto/electrical → trades), offering_type authority,
 * subject-correct images (barber/auto), industry-template cascade, honest stats,
 * gallery, SEO, and the validate&refine pass. Reuses cached content_spec (no
 * Anthropic cost). Skips claimed/published sites. Upserts back to Supabase.
 */
import 'dotenv/config'
import { getSupabase, upsertWebsite } from './src/db/client.js'
import { generateFromTemplate } from './src/generator/templateEngine.js'
import { validateAndRefine } from './src/generator/refine.js'
import { resolveCategory } from './src/templates/categories.js'
import { businessDnaToSpec } from './src/intelligence/dnaAdapter.js'

function specFor(b) {
  if (b.content_spec) return b.content_spec
  if (b.business_dna) return businessDnaToSpec(b.business_dna, b)
  return null
}

async function main() {
  const db = getSupabase()
  // Only unclaimed, already-generated sites — never touch claimed/published.
  const { data, error } = await db
    .from('websites')
    .select('slug, status, businesses(id, name, slug, category, city, country, phone, email, address, raw_data, content_spec, business_dna)')
    .eq('status', 'generated')
    .limit(5000)
  if (error) throw new Error(`websites query failed: ${error.message}`)

  const jobs = (data || []).filter(r => r.businesses && r.businesses.slug)
  console.log(`Regenerating ${jobs.length} generated sites...\n`)

  let ok = 0, fail = 0
  const catTally = {}
  const t0 = Date.now()

  for (let i = 0; i < jobs.length; i++) {
    const b = jobs[i].businesses
    try {
      const { key, config } = resolveCategory(b)
      const spec = specFor(b)
      const result = await generateFromTemplate(b, key, config, spec)
      const { html } = validateAndRefine({ html: result.html, business: b, spec })
      await upsertWebsite({
        businessId: result.businessId,
        slug: result.slug,
        html,
        categoryKey: result.categoryKey,
        theme: result.theme,
        sections: result.sections,
      })
      ok++
      catTally[result.categoryKey] = (catTally[result.categoryKey] || 0) + 1
    } catch (e) {
      fail++
      console.log(`  ✗ ${b.name}: ${e.message}`)
    }
    if ((i + 1) % 25 === 0 || i === jobs.length - 1) {
      const secs = ((Date.now() - t0) / 1000).toFixed(0)
      console.log(`  [${i + 1}/${jobs.length}] ok=${ok} fail=${fail} (${secs}s)`)
    }
  }

  console.log(`\n=== DONE: ${ok} regenerated, ${fail} failed in ${((Date.now() - t0) / 1000).toFixed(0)}s ===`)
  console.log('By template:', Object.entries(catTally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join('  '))
  process.exit(0)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
