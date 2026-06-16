/**
 * build-templates.js
 *
 * ONE-TIME SCRIPT — run this once to generate premium HTML templates per category.
 * After this, site generation uses zero Claude API calls (pure template fill).
 *
 * Usage:
 *   node src/templates/build-templates.js              # build all categories
 *   node src/templates/build-templates.js --cat salon  # rebuild one category
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync, mkdirSync } from 'fs'
import { logger } from '../utils/logger.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const OUT_DIR = 'src/templates/html'

const CATEGORIES = {
  restaurant: {
    label: 'Restaurant / Café / Bakery / Food & Dining',
    icon: '🍽️',
    primaryCta: 'Order Now',
    secondaryCta: 'View Menu',
    accentColor: '#C0392B',
    secondaryColor: '#E67E22',
    sections: ['hero with food imagery collage', 'scrolling marquee of menu items', 'signature dishes grid (6 items)', 'about / our story', 'hours & location', 'contact'],
    tone: 'warm, appetising, community-focused',
    placeholders: ['menu items', 'dishes', 'cuisine type', 'signature items'],
  },
  salon: {
    label: 'Salon / Beauty / Barbershop / Spa / Wellness',
    icon: '✂️',
    primaryCta: 'Book Appointment',
    secondaryCta: 'See Services',
    accentColor: '#7D3C98',
    secondaryColor: '#A569BD',
    sections: ['hero with before/after mood', 'services menu with prices', 'photo gallery grid (6 images)', 'meet the team', 'booking CTA section', 'contact'],
    tone: 'elegant, confidence-boosting, luxurious',
    placeholders: ['services', 'team members', 'specialties'],
  },
  trades: {
    label: 'Construction / Trades / Home Services / Repair',
    icon: '🔧',
    primaryCta: 'Get a Free Quote',
    secondaryCta: 'Call Now',
    accentColor: '#1A5276',
    secondaryColor: '#2E86C1',
    sections: ['hero with project imagery', 'services offered (6 cards)', 'why choose us (3 trust pillars)', 'project gallery', 'service area map placeholder', 'contact & quote form'],
    tone: 'professional, trustworthy, reliable',
    placeholders: ['services', 'project types', 'service area cities'],
  },
  medical: {
    label: 'Medical / Dental / Clinic / Health',
    icon: '🏥',
    primaryCta: 'Book Appointment',
    secondaryCta: 'New Patient Info',
    accentColor: '#1A7A4A',
    secondaryColor: '#239B56',
    sections: ['hero calm and reassuring', 'services / treatments', 'insurance accepted logos row', 'meet the doctor placeholder', 'patient testimonials', 'contact & appointment'],
    tone: 'calm, professional, reassuring',
    placeholders: ['treatments', 'insurance networks', 'doctor name'],
  },
  legal: {
    label: 'Legal / Law Firm / Accountant / Financial',
    icon: '⚖️',
    primaryCta: 'Free Consultation',
    secondaryCta: 'Our Practice Areas',
    accentColor: '#1C2833',
    secondaryColor: '#2C3E50',
    sections: ['authoritative hero with city skyline mood', 'practice areas (6 cards)', 'about the attorney', 'case results / stats', 'free consultation CTA', 'contact'],
    tone: 'authoritative, trustworthy, results-focused',
    placeholders: ['practice areas', 'attorney name', 'case types'],
  },
  retail: {
    label: 'Retail / Shop / Boutique / Store',
    icon: '🛍️',
    primaryCta: 'Shop Now',
    secondaryCta: 'Visit Us',
    accentColor: '#2874A6',
    secondaryColor: '#5DADE2',
    sections: ['hero with product lifestyle imagery', 'featured products grid (6)', 'scrolling brand/category ticker', 'about the store', 'hours & location', 'contact'],
    tone: 'friendly, product-focused, local charm',
    placeholders: ['product categories', 'featured items', 'store story'],
  },
}

const SYSTEM_PROMPT = `You are a world-class frontend developer building premium HTML templates for a website platform called Guma AI that auto-generates websites for small local businesses.

You will produce ONE complete, self-contained HTML template for a specific business category.

## Template rules

1. Output ONLY raw HTML starting with <!DOCTYPE html>. No markdown, no explanation.
2. All CSS inside a <style> tag in <head>. No external CSS files.
3. All JS inside a <script> tag before </body>. Keep it lean and purposeful.
4. No external dependencies except: Google Fonts (one font only, loaded via @import in the style tag).
5. Use CSS custom properties (--color-primary, --color-accent, etc.) defined in :root for all colours.
6. Mobile-first responsive layout. Breakpoint at 768px.

## Placeholder tokens (MUST use these exact strings)

The template engine will replace these tokens with real business data:

BUSINESS DATA:
- {{BUSINESS_NAME}} — e.g. "Lola's Oven"
- {{TAGLINE}} — AI-generated one-liner
- {{DESCRIPTION}} — 2-3 sentence about section
- {{CITY}} — e.g. "Iloilo City"
- {{COUNTRY}} — e.g. "PH"
- {{PHONE}} — phone number
- {{ADDRESS}} — full street address
- {{HOURS}} — operating hours string
- {{RATING}} — e.g. "4.8"
- {{REVIEW_COUNT}} — e.g. "341"
- {{CATEGORY}} — business category label
- {{SLUG}} — URL slug for claim link
- {{YEAR}} — current year

IMAGES (always available):
- {{HERO_IMAGE}} — full-bleed hero background image URL
- {{GALLERY_1}} through {{GALLERY_6}} — gallery photo URLs

CONTENT ARRAYS (pipe-separated, template engine will split and render):
- {{SERVICES}} — e.g. "Haircut|Shave|Beard Trim|Kids Cut|Hot Towel"
- {{MENU_ITEMS}} — scrolling ticker items
- {{TRUST_POINTS}} — e.g. "Licensed & Insured|10+ Years Experience|Free Quotes"

MULTILINGUAL (Philippines):
- {{LANG_TOGGLE}} — inject EN/FIL toggle button HTML here
- {{FIL_TAGLINE}} — Filipino translation of tagline
- {{FIL_CTA}} — Filipino CTA button text

URLS:
- {{CLAIM_URL}} — full claim page URL
- {{SITE_URL}} — public site URL

## Design requirements

- Use the exact accent/secondary colours specified for this category
- Hero: full-bleed background image ({{HERO_IMAGE}}), min-height 90vh, dark overlay (rgba 0,0,0,0.5), centred text
- Include a slim dismissible claim banner ABOVE the sticky nav: "This site was built for you by Guma AI — claim it free · <a href='{{CLAIM_URL}}'>Claim my site →</a>" with a ✕ close button
- Sticky nav: business name left, nav links centre, primary CTA button right, plus {{LANG_TOGGLE}} slot
- Scrolling marquee ticker (CSS animation, infinite loop) — use {{MENU_ITEMS}} tokens as items
- Gallery: CSS grid, 3 columns desktop / 2 tablet / 1 mobile, images use object-fit:cover
- FREE vs PRO comparison table before the footer — show what's free forever vs Pro ($29/mo): custom domain, drag-and-drop editor, booking form, remove Guma AI badge, priority support
- Sticky mobile bottom bar (fixed, only on <768px): "Is this your business? Claim it free →" linking to {{CLAIM_URL}}
- Social proof nudge near claim CTA: "{{SOCIAL_PROOF_COUNT}} businesses claimed their site this week"
- Footer: copyright {{YEAR}}, "Powered by Guma AI" badge, links
- Pulse animation on primary claim CTA button
- Smooth scroll, hover transitions on all interactive elements
- The design should look like it was built by a professional agency — not a template

## Multilingual (Philippines)
Add a language toggle (EN | FIL) in the nav. When FIL active, swap: nav link labels, hero tagline, CTA button text, claim banner text — all via vanilla JS data attributes. Store translations inline in a JS object.`

function buildUserPrompt(key, config) {
  return `Build the premium HTML template for this category:

Category: ${config.label}
Icon: ${config.icon}
Primary CTA: "${config.primaryCta}"
Secondary CTA: "${config.secondaryCta}"
Primary colour: ${config.accentColor}
Secondary colour: ${config.secondaryColor}
Tone: ${config.tone}

Sections to include (in this order):
${config.sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Key content placeholders for this category:
${config.placeholders.map(p => `- {{${p.toUpperCase().replace(/ /g, '_')}}}`).join('\n')}

Make the design STUNNING — editorial quality, tight typography, real visual hierarchy.
This template will be seen by thousands of small business owners who will judge whether to claim their site within 5 seconds.

Output the complete HTML template now.`
}

async function buildTemplate(key, config) {
  logger.info(`Building template: ${key} (${config.label})`)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 32000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(key, config) }],
  })

  if (response.stop_reason === 'max_tokens') {
    logger.warn(`${key} hit max_tokens — closing HTML`)
  }

  let html = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim()
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/\s*```\s*$/, '')

  if (!html.toLowerCase().startsWith('<!doctype') && !html.toLowerCase().startsWith('<!DOCTYPE')) {
    const idx = html.toLowerCase().indexOf('<!doctype')
    if (idx > 0) html = html.slice(idx)
  }

  if (!html.includes('</html>')) html += '\n</body></html>'

  const outPath = `${OUT_DIR}/${key}.html`
  writeFileSync(outPath, html, 'utf8')
  logger.info(`✓ ${key} template saved → ${outPath} (${(html.length / 1024).toFixed(1)} KB)`)
  return outPath
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const args = process.argv.slice(2)
  const catArg = args.indexOf('--cat')
  const targetCat = catArg !== -1 ? args[catArg + 1] : null

  const tooBuild = targetCat
    ? { [targetCat]: CATEGORIES[targetCat] }
    : CATEGORIES

  if (targetCat && !CATEGORIES[targetCat]) {
    logger.error(`Unknown category: ${targetCat}. Options: ${Object.keys(CATEGORIES).join(', ')}`)
    process.exit(1)
  }

  logger.info(`Building ${Object.keys(tooBuild).length} template(s)...`)

  for (const [key, config] of Object.entries(tooBuild)) {
    try {
      await buildTemplate(key, config)
      // Small delay to avoid rate limits when building all at once
      if (Object.keys(tooBuild).length > 1) await sleep(2000)
    } catch (err) {
      logger.error(`Failed to build ${key} template`, { error: err.message })
    }
  }

  logger.info('All templates built. Generator will now use template fill — zero Claude API calls per site.')
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

main().catch(err => {
  logger.error('Fatal', { error: err.message })
  process.exit(1)
})
