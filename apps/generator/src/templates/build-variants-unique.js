/**
 * build-variants-unique.js
 *
 * Generate 12 TRULY UNIQUE layouts (2 per category, completely different designs).
 * This is the last Claude API call before template fill becomes zero-cost forever.
 *
 * Variant A: Hero + Services + Gallery (editorial flow)
 * Variant B: Gallery-first + Services + Hero lower (showcase-first flow)
 *
 * Usage:
 *   node src/templates/build-variants-unique.js
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync, mkdirSync } from 'fs'
import { logger } from '../utils/logger.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const OUT_DIR = 'src/templates/html'

const VARIANTS = {
  restaurant: [
    {
      key: 'restaurant-showcase',
      label: 'Restaurant / Gallery-First Showcase',
      approach: 'Start with a 3-column menu/dish photo grid, THEN tagline, THEN hero with overlay text lower. Emphasise visual food appeal upfront.',
      primaryCta: 'Order Now',
      accentColor: '#C0392B',
    },
    {
      key: 'restaurant-editorial',
      label: 'Restaurant / Editorial Experience',
      approach: 'Classic editorial: hero with tagline, scrolling marquee of menu items, about/story section, then full menu grid with descriptions. Storytelling first.',
      primaryCta: 'View Menu',
      accentColor: '#C0392B',
    },
  ],
  salon: [
    {
      key: 'salon-luxury',
      label: 'Salon / Luxury Minimal',
      approach: 'Minimal hero, then large before/after image pairs side-by-side, services as elegant list with pricing, testimonials/reviews, booking CTA. Luxury aesthetic.',
      primaryCta: 'Book Now',
      accentColor: '#7D3C98',
    },
    {
      key: 'salon-grid',
      label: 'Salon / Service Grid Showcase',
      approach: 'Hero with services visible immediately below, 6-card grid of service photos/names/prices, team gallery, contact. Grid-focused, scannable.',
      primaryCta: 'Book Appointment',
      accentColor: '#7D3C98',
    },
  ],
  trades: [
    {
      key: 'trades-portfolio',
      label: 'Trades / Project Portfolio',
      approach: 'Hero tagline, then large project showcase gallery (3-col grid), services listed below, testimonials, service area map, contact form. Project-focused.',
      primaryCta: 'View Projects',
      accentColor: '#1A5276',
    },
    {
      key: 'trades-services',
      label: 'Trades / Services-First Directory',
      approach: 'Services as big expandable cards first (no hero), each card has icon + description + CTA, then portfolio, then testimonials, contact. Services lead.',
      primaryCta: 'Get Quote',
      accentColor: '#1A5276',
    },
  ],
  medical: [
    {
      key: 'medical-practice',
      label: 'Medical / Practice Overview',
      approach: 'Calm hero, then team member cards (photo, name, title, bio), services grid, insurance logos, patient testimonials, appointment CTA. Trust through people.',
      primaryCta: 'Book Appointment',
      accentColor: '#1A7A4A',
    },
    {
      key: 'medical-clinical',
      label: 'Medical / Clinic Services',
      approach: 'Hero with calm imagery, services as tabs/cards with icons, treatment process explained step-by-step, FAQs, reviews, contact. Informational first.',
      primaryCta: 'Schedule Now',
      accentColor: '#1A7A4A',
    },
  ],
  legal: [
    {
      key: 'legal-firm',
      label: 'Legal / Law Firm Authority',
      approach: 'Authoritative hero, practice areas as large text-heavy cards with icons, attorney bio/photo, case results/testimonials, consultation CTA. Authority-driven.',
      primaryCta: 'Schedule Consultation',
      accentColor: '#1C2833',
    },
    {
      key: 'legal-services',
      label: 'Legal / Services Directory',
      approach: 'Hero with services visible below, services as collapsible accordion or tabs, FAQs about common legal issues, testimonials, team, contact. Services taxonomy.',
      primaryCta: 'Free Consultation',
      accentColor: '#1C2833',
    },
  ],
  retail: [
    {
      key: 'retail-showcase',
      label: 'Retail / Product Showcase',
      approach: 'Hero product lifestyle image, then 4-6 product category cards in grid with hover effects, featured items, scrolling ticker, hours/map, contact. Product-focused.',
      primaryCta: 'Shop Now',
      accentColor: '#2874A6',
    },
    {
      key: 'retail-story',
      label: 'Retail / Store Story & Products',
      approach: 'Hero with store photo/vibe, "About the Store" narrative section first, then products grid, hours/location, testimonials, contact. Story-first retail.',
      primaryCta: 'Visit Us',
      accentColor: '#2874A6',
    },
  ],
}

const SYSTEM_PROMPT = `You are a world-class frontend developer creating a SECOND UNIQUE layout variant for a business category in Guma AI.

This is a DIFFERENT design approach from the first template — not a minor reshuffle, but a genuinely distinct visual and information architecture.

## Template rules (same as before)
1. Output ONLY raw HTML starting with <!DOCTYPE html>. No markdown, no explanation.
2. All CSS inside <style> in <head>. No external CSS files or dependencies.
3. All JS inside <script> before </body>. Vanilla JS only.
4. Use CSS custom properties (--color-primary, --color-accent) defined in :root for all colours.
5. Mobile-first responsive layout. Breakpoint at 768px.
6. Make this design VISUALLY DISTINCT from the first template: different section hierarchy, different visual flow, different emphasis.

## Placeholder tokens (same as before)
All the {{PLACEHOLDERS}} from the original templates still apply. The engine will fill them the same way.

## Key: This must FEEL different
- If the first template is hero-centric, this one emphasizes content/gallery/services first
- If the first uses large hero photos, this one uses smaller hero + content spotlight
- If the first is scrolly/narrative, this one is scannable/grid-based
- Use different typography hierarchy, different spacing, different visual weight distribution

Design for premium small business owners. Make them think "wow, this layout is perfect for MY business" — different from the standard template.`

function buildVariantPrompt(variant) {
  return `Build the UNIQUE HTML template for this category variant:

Category variant: ${variant.label}
Design approach: ${variant.approach}
Primary CTA: "${variant.primaryCta}"
Primary colour: ${variant.accentColor}

This is a SECOND, COMPLETELY DIFFERENT layout for this category. Not a tweak of the first template.

Key difference: ${variant.approach}

Make the visual and information architecture genuinely distinct. Different section order, different visual hierarchy, different emphasis.

Output the complete, production-ready HTML template now.`
}

async function buildVariant(key, variant) {
  logger.info(`Building variant: ${key}`)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 32000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildVariantPrompt(variant) }],
  })

  let html = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim()
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/\s*```\s*$/, '')

  if (!html.toLowerCase().startsWith('<!doctype')) {
    const idx = html.toLowerCase().indexOf('<!doctype')
    if (idx > 0) html = html.slice(idx)
  }

  if (!html.includes('</html>')) html += '\n</body></html>'

  const outPath = `${OUT_DIR}/${key}.html`
  writeFileSync(outPath, html, 'utf8')
  logger.info(`✓ ${key} saved → ${(html.length / 1024).toFixed(1)} KB`)
  return outPath
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  logger.info('Building 12 unique variant layouts (2 per category)...')

  let created = 0
  for (const [category, variants] of Object.entries(VARIANTS)) {
    for (const variant of variants) {
      try {
        await buildVariant(variant.key, variant)
        created++
        // Delay to avoid rate limits
        await sleep(2000)
      } catch (err) {
        logger.error(`Failed to build ${variant.key}`, { error: err.message })
      }
    }
  }

  logger.info(`✓ Created ${created}/12 variant layouts. Total templates: 18 (6 core + 12 variants)`)
  logger.info('Generator will now randomly pick a variant when filling templates.')
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

main().catch(err => {
  logger.error('Fatal', { error: err.message })
  process.exit(1)
})
