/**
 * generate-single.js
 *
 * Generate a site for one business directly — bypasses the queue.
 * Useful for testing and manual regeneration.
 *
 * Usage:
 *   node src/generate-single.js --id <businessId>
 *   node src/generate-single.js --slug <slug>
 *   node src/generate-single.js --demo          # uses hardcoded demo business
 */

import 'dotenv/config'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { SiteGenerator } from './generator/siteGenerator.js'
import { generateFromTemplate } from './generator/templateEngine.js'
import { resolveCategory } from './templates/categories.js'
import { getBusinessById } from './db/client.js'
import { upsertWebsite } from './db/client.js'
import { logger } from './utils/logger.js'

const DEMO_BUSINESS = {
  id: 'demo-001',
  name: "Bella's Pizza",
  slug: 'bellas-pizza-new-york-ny',
  category: 'Restaurant',
  phone: '(212) 555-0182',
  email: null,
  address: '48 Mott St, New York, NY 10013',
  city: 'New York',
  country: 'US',
  source_dir: 'yellowpages',
  has_website: false,
  raw_data: {
    state: 'NY',
    zip: '10013',
    description: 'Authentic New York-style pizza by the slice and whole pie since 1994. Family-owned, dine-in and takeout.',
    hours: 'Mon–Sat: 11am–10pm, Sun: 12pm–9pm',
    rating: '4.7',
    review_count: 382,
  },
}

async function main() {
  const args = process.argv.slice(2)
  const idIdx = args.indexOf('--id')
  const slugIdx = args.indexOf('--slug')
  const isDemo = args.includes('--demo')

  let business

  if (isDemo) {
    business = DEMO_BUSINESS
    logger.info('Using demo business: Bella\'s Pizza')
  } else if (idIdx !== -1) {
    const id = args[idIdx + 1]
    logger.info(`Loading business: ${id}`)
    business = await getBusinessById(id)
  } else if (slugIdx !== -1) {
    // Could add slug lookup here
    logger.error('--slug lookup not yet implemented — use --id or --demo')
    process.exit(1)
  } else {
    logger.error('Usage: node src/generate-single.js [--id <id>] [--slug <slug>] [--demo]')
    process.exit(1)
  }

  if (!business) {
    logger.error('Business not found')
    process.exit(1)
  }

  logger.info(`Generating site for: ${business.name}`)

  // Use pre-built template if available (zero API cost), else fall back to Claude
  const { key: categoryKey, config: categoryConfig } = resolveCategory(business)
  const templatePath = `src/templates/html/${categoryKey}.html`
  const useTemplate = existsSync(templatePath)

  let result
  if (useTemplate) {
    logger.info(`Using pre-built template: ${categoryKey}.html (zero cost)`)
    result = await generateFromTemplate(business, categoryKey, categoryConfig)
  } else {
    logger.info(`No template for ${categoryKey} — calling Claude API`)
    const generator = new SiteGenerator()
    result = await generator.generate(business)
  }

  // Save to local file for inspection
  mkdirSync('output', { recursive: true })
  const outPath = `output/${result.slug}.html`
  writeFileSync(outPath, result.html, 'utf8')
  logger.info(`HTML written to: ${outPath}`)
  logger.info(`Category: ${result.categoryKey}`)
  logger.info(`HTML size: ${(result.html.length / 1024).toFixed(1)} KB`)
  logger.info(`Token estimate: ~${result.tokenEstimate}`)

  // Save to DB if not demo
  if (!isDemo) {
    const website = await upsertWebsite({
      businessId: result.businessId,
      slug: result.slug,
      html: result.html,
      categoryKey: result.categoryKey,
      theme: result.theme,
      sections: result.sections,
    })
    logger.info(`Saved to DB: website ID ${website.id}`)
  }

  logger.info(`\nOpen in browser: open ${outPath}`)
}

main().catch((err) => {
  logger.error('Fatal', { error: err.message })
  process.exit(1)
})
