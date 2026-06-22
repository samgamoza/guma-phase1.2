/**
 * "WOW" experiment — Tailwind + design-freedom renderer.
 *
 * Same model as test-sonnet.js (claude-sonnet-4-6), but a completely different
 * harness: Tailwind (Play CDN) + characterful Google Fonts + Lucide icons +
 * Alpine.js, and a prompt that grants DESIGN FREEDOM instead of dictating a
 * fixed skeleton. The BusinessDNA drives the creative direction (layout
 * archetype, type system, color, motif) so each site is genuinely distinct.
 *
 * Proves whether "same Claude, better scaffolding + freer prompt" closes the gap
 * to Lovable/Bolt/v0-tier output. Single self-contained .html, no build step.
 *
 *   node src/generator/test-wow.js <businessId>
 */
import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { getBusinessById, upsertWebsite } from '../db/client.js'
import { resolveCategory } from '../templates/categories.js'
import { resolveImages } from './images.js'

const MODEL = 'claude-sonnet-4-6'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const SITE_BASE = (process.env.SITE_BASE_URL || 'https://guma.ai/sites')

const SYSTEM = `You are an award-winning web designer and front-end engineer. You craft STUNNING, distinctive, modern single-page websites for local businesses — the kind featured on Awwwards, not generic templates. Your work makes people say "wow."

## Tech — ONE self-contained HTML file, no build step
- Tailwind CSS via Play CDN: <script src="https://cdn.tailwindcss.com"></script>. Style EVERYTHING with Tailwind utility classes. Configure a custom theme inline via tailwind.config (brand colors + the fonts you choose).
- Google Fonts via <link>: choose a DISTINCTIVE, characterful pairing that fits the brand — a striking display/heading face + a clean readable body. NEVER default to Inter, Roboto, Arial, or system-ui.
- Lucide icons via CDN: <script src="https://unpkg.com/lucide@latest"></script> then lucide.createIcons(). Use real icons, not emoji.
- Alpine.js via CDN for light interactivity (mobile menu, reveals). Keep JS minimal and unobtrusive.

## Design mandate — THIS is what matters most
- BE DISTINCTIVE. NEVER ship generic AI-generated aesthetics: no default fonts, no purple-gradient-on-white, no predictable "centered hero + three equal cards." Every site must have context-specific character reflecting THIS exact business.
- CHOOSE A LAYOUT ARCHETYPE that fits the brand and VARY it per business — e.g. bold editorial, asymmetric split-screen, full-bleed cinematic, refined minimal, warm boutique, technical/industrial. Do not reach for one default skeleton.
- World-class fundamentals: confident, expressive type hierarchy (large headlines with real character), generous whitespace, intentional color, strong visual rhythm, layered depth (subtle shadows, borders, overlays), thoughtful imagery treatment (duotone, gradient overlays, framing, masks).
- Motion & micro-interactions: smooth scroll, scroll-reveal animations, hover states, tasteful transitions. The page should feel alive and crafted.
- Mobile-first and flawlessly responsive.
- Accessibility & SEO: semantic HTML, alt text, sufficient contrast, EXACTLY ONE <h1>.

## Non-negotiables (make them tasteful, not boilerplate)
- Use the real business data verbatim (name, phone, address, hours). NEVER invent a phone, address, or email.
- Use ONLY the provided image URLs. Never invent image URLs. If an image doesn't fit a spot, use a tasteful Tailwind gradient/solid instead.
- A slim, dismissible top banner: "Built for you by Guma AI — claim it free →" linking to the claim URL.
- A small "Powered by Guma AI" line in the footer.
- One clear primary CTA appropriate to the business (Book / Call / Get a Quote / Reserve).

## Output
Respond with ONLY the raw HTML document, starting with <!DOCTYPE html>. No markdown fences, no commentary.`

function buildUser({ business, dna, images, claimUrl, siteUrl }) {
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
  }
  return `Design and build a stunning website for this business. Let the STRATEGIC BLUEPRINT drive your creative direction — pick a layout archetype, type system, color story, and motif that express this brand. Choose ONE hero from hero_variants (do not show all three).

Treat uiux_strategy.design_direction / color_direction / typography_style / layout_style as your creative brief, and competitive_positioning.brand_personality as the emotional tone. Make it unmistakably for THIS business — not a template.

## BUSINESS FACTS (verbatim — never invent contact info)
${JSON.stringify(facts, null, 2)}

## STRATEGIC BLUEPRINT (BusinessDNA)
${JSON.stringify(dna, null, 2)}

## IMAGES (use these exact URLs only)
Hero: ${images?.heroUrl || '(none — use a tasteful gradient)'}
Gallery (use as fits the design):
${(images?.galleryUrls || []).map((u, i) => `  ${i + 1}. ${u}`).join('\n') || '  (none)'}

## Links
Claim URL: ${claimUrl}
Canonical site URL: ${siteUrl}

Now output the complete HTML. Make it award-worthy.`
}

function cleanHtml(raw) {
  let html = raw.trim().replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/i, '')
  const idx = html.toLowerCase().indexOf('<!doctype')
  if (idx > 0) html = html.slice(idx)
  return html
}

async function main() {
  const id = process.argv[2]
  if (!id) { console.error('Usage: node src/generator/test-wow.js <businessId>'); process.exit(1) }

  const business = await getBusinessById(id)
  const dna = business.business_dna
  if (!dna) { console.error(`No business_dna for ${business.name} — run BI first.`); process.exit(1) }

  const { key: categoryKey, config: categoryConfig } = resolveCategory(business)
  const images = await resolveImages(categoryKey, business)
  const claimUrl = `https://guma.ai/claim/${business.slug}`
  const siteUrl  = `${SITE_BASE}/${business.slug}`

  console.log(`\n=== WOW test: ${business.name} (${categoryKey}) ===`)
  console.log(`niche: ${dna.classification?.niche}`)
  console.log(`design_direction: ${dna.uiux_strategy?.design_direction || '—'}`)
  console.log(`images: hero=${images.heroUrl ? 'ok' : 'none'}, gallery=${(images.galleryUrls||[]).length}`)
  console.log(`\nGenerating with ${MODEL} (Tailwind + design-freedom)...`)

  const start = Date.now()
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    system: SYSTEM,
    messages: [{ role: 'user', content: buildUser({ business, dna, images, claimUrl, siteUrl }) }],
  })
  const msg = await stream.finalMessage()
  const html = cleanHtml(msg.content.filter(b => b.type === 'text').map(b => b.text).join(''))

  const inTok = msg.usage?.input_tokens || 0
  const outTok = msg.usage?.output_tokens || 0
  const cost = ((inTok * 3 + outTok * 15) / 1e6).toFixed(4)
  console.log(`\n=== Result ===`)
  console.log(`stop_reason: ${msg.stop_reason}`)
  console.log(`html bytes: ${html.length}`)
  console.log(`uses tailwind cdn: ${html.includes('cdn.tailwindcss.com')}`)
  console.log(`google fonts: ${html.includes('fonts.googleapis.com')}`)
  console.log(`lucide icons: ${html.includes('lucide')}`)
  console.log(`<h1> count: ${(html.match(/<h1/gi)||[]).length}`)
  console.log(`tokens: ${inTok} in + ${outTok} out  |  cost: $${cost}  |  ${((Date.now()-start)/1000).toFixed(1)}s`)

  await upsertWebsite({
    businessId: business.id,
    slug: business.slug,
    html,
    categoryKey,
    theme: categoryConfig.theme,
    sections: categoryConfig.sections,
  })
  console.log(`\nSaved. View: localhost:3000/sites/${business.slug}`)
  process.exit(0)
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
