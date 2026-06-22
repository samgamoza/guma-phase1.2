/**
 * Sonnet LLM-authored site test (the "Option B" experiment).
 *
 * Generates a COMPLETE single-page site with claude-sonnet-4-6, authored from
 * the business's BusinessDNA blueprint (not a token template). Saves the result
 * to websites.html_content so it's viewable at /sites/<slug>, and reports
 * tokens + cost.
 *
 *   node src/generator/test-sonnet.js <businessId>
 *
 * This does NOT touch the production pipeline — it's a standalone proof.
 */
import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { getBusinessById, upsertWebsite } from '../db/client.js'
import { resolveCategory } from '../templates/categories.js'
import { buildSystemPrompt } from './prompts.js'
import { resolveImages } from './images.js'

const MODEL = 'claude-sonnet-4-6'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const SITE_BASE = process.env.SITE_BASE_URL || 'https://guma.ai/sites'

function buildDnaUserPrompt({ business, categoryConfig, images, dna }) {
  const rd = business.raw_data || {}
  const facts = {
    name: business.name,
    phone: business.phone || null,
    email: business.email || null,
    address: business.address || business.city || null,
    city: business.city || null,
    country: business.country || 'PH',
    hours: rd.hours || 'Call us for current hours',
    rating: rd.rating || null,
    review_count: rd.review_count || rd.reviewCount || 0,
    slug: business.slug,
  }

  return `Build a complete, premium, conversion-focused single-page website for this business.

You are given a deep STRATEGIC BLUEPRINT (BusinessDNA) produced by a senior brand/UX strategist. Build the page so it *expresses that strategy* — this is the whole point. Specifically:
- Choose the single most fitting hero from hero_variants for this brand and use it as the H1 + sub-copy (do NOT print all three).
- Honor uiux_strategy: color_direction, typography_style, layout_style, imagery_strategy, and section_order.
- Use content_strategy.offerings for the services/offerings section, content_strategy.trust_points for "why choose us", content_strategy.about_text for the story.
- Reflect competitive_positioning (differentiators, brand_personality) in tone and visual weight.
- Use seo_strategy.meta_title / meta_description for <title> and meta description.
- Tailor copy to target_audience (their motivations + objections).

## BUSINESS FACTS (use verbatim — never invent phone/address/email)
${JSON.stringify(facts, null, 2)}

## STRATEGIC BLUEPRINT (BusinessDNA)
${JSON.stringify(dna, null, 2)}

## IMAGES (use these exact URLs — do not invent image URLs)
Hero: ${images?.heroUrl || '(none — use a tasteful CSS gradient)'}
Gallery (use in order):
${(images?.galleryUrls || []).map((u, i) => `  ${i + 1}. ${u}`).join('\n') || '  (none)'}

## Reference palette (you may refine toward color_direction)
- Primary: ${categoryConfig.theme.primary}
- Secondary: ${categoryConfig.theme.secondary}
- Accent: ${categoryConfig.theme.accent}

Output the complete raw HTML now, starting with <!DOCTYPE html>. Remember the required claim banner, mobile claim bar, single <h1>, and "Powered by Guma AI" footer per the system rules.`
}

function cleanHtml(raw, business) {
  let html = raw.trim().replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '')
  const idx = html.toLowerCase().indexOf('<!doctype')
  if (idx > 0) html = html.slice(idx)
  return html
}

async function main() {
  const id = process.argv[2]
  if (!id) { console.error('Usage: node src/generator/test-sonnet.js <businessId>'); process.exit(1) }

  const business = await getBusinessById(id)
  const dna = business.business_dna
  if (!dna) { console.error(`Business ${business.name} has no business_dna — run the BI agent first.`); process.exit(1) }

  const { key: categoryKey, config: categoryConfig } = resolveCategory(business)
  console.log(`\n=== Sonnet test: ${business.name} (${categoryKey}) ===`)
  console.log(`niche: ${dna.classification?.niche}`)

  const images = await resolveImages(categoryKey, business)
  console.log(`images: hero=${images.heroUrl ? 'ok' : 'none'}, gallery=${(images.galleryUrls||[]).length}`)

  const system = buildSystemPrompt()
  const user   = buildDnaUserPrompt({ business, categoryConfig, images, dna })

  console.log(`\nGenerating with ${MODEL} (streaming)...`)
  const start = Date.now()
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    system,
    messages: [{ role: 'user', content: user }],
  })
  const msg = await stream.finalMessage()
  const text = msg.content.filter(b => b.type === 'text').map(b => b.text).join('')
  const html = cleanHtml(text, business)

  const inTok = msg.usage?.input_tokens || 0
  const outTok = msg.usage?.output_tokens || 0
  const cost = ((inTok * 3 + outTok * 15) / 1e6).toFixed(4)
  console.log(`\n=== Result ===`)
  console.log(`stop_reason: ${msg.stop_reason}`)
  console.log(`html bytes: ${html.length}`)
  console.log(`tokens: ${inTok} in + ${outTok} out  |  cost: $${cost}  |  ${((Date.now()-start)/1000).toFixed(1)}s`)

  await upsertWebsite({
    businessId: business.id,
    slug: business.slug,
    html,
    categoryKey,
    theme: categoryConfig.theme,
    sections: categoryConfig.sections,
  })
  console.log(`\nSaved. View at: ${SITE_BASE.replace('https://guma.ai/sites','http://localhost:3000/sites')}/${business.slug}`)
  console.log(`(or localhost:3000/sites/${business.slug})`)
  process.exit(0)
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
