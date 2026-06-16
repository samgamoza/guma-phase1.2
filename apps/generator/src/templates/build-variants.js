/**
 * build-variants.js
 *
 * Create 2 distinct layout variants per category by modifying existing templates.
 * Runs ONCE. Then site generation randomly picks a variant for visual variety.
 *
 * Strategy:
 *   - Variant A: Hero-first (current approach)
 *   - Variant B: Content-first (starts with gallery/services, hero lower)
 *
 * This creates 12 layouts (6 categories × 2 variants) with zero additional API cost.
 */

import { readFileSync, writeFileSync } from 'fs'
import { logger } from '../utils/logger.js'

const CATEGORIES = ['restaurant', 'salon', 'trades', 'medical', 'legal', 'retail']
const TEMPLATE_DIR = 'src/templates/html'

/**
 * Variant A: Hero-first (original structure)
 * Keep existing template as is, just rename it
 */
function copyHeroFirst(category) {
  const srcPath = `${TEMPLATE_DIR}/${category}.html`
  const destPath = `${TEMPLATE_DIR}/${category}-hero.html`

  try {
    const html = readFileSync(srcPath, 'utf8')
    writeFileSync(destPath, html, 'utf8')
    logger.info(`✓ ${category}-hero.html created (hero-first layout)`)
    return true
  } catch (err) {
    logger.warn(`Could not copy ${category} template`, { error: err.message })
    return false
  }
}

/**
 * Variant B: Content-first (reorder major sections)
 * Move hero lower, bring gallery/services/features to top
 * Simple regex-based section reordering
 */
function createContentFirstVariant(category) {
  const srcPath = `${TEMPLATE_DIR}/${category}.html`
  const destPath = `${TEMPLATE_DIR}/${category}-content.html`

  try {
    let html = readFileSync(srcPath, 'utf8')

    // Extract hero section using class or id match
    const heroRegex = /<section[^>]*(?:id="hero"|class="hero"|class="[^"]*hero[^"]*")[^>]*>[\s\S]*?<\/section>/i
    const heroMatch = html.match(heroRegex)
    
    // Extract footer section
    const footerRegex = /<footer[^>]*>[\s\S]*?<\/footer>/i
    const footerMatch = html.match(footerRegex)

    if (heroMatch && footerMatch) {
      // Rebuild with content first: remove hero and footer from original, and append them at the end of body
      let reordered = html
        .replace(heroRegex, '')
        .replace(footerRegex, '')
        .replace(/<\/body>/, `${heroMatch[0]}\n${footerMatch[0]}\n</body>`)

      writeFileSync(destPath, reordered, 'utf8')
      logger.info(`✓ ${category}-content.html created (content-first layout)`)
      return true
    } else {
      logger.warn(`Could not parse ${category} template for variant`, { error: 'sections not found' })
      return false
    }
  } catch (err) {
    logger.warn(`Could not create ${category}-content variant`, { error: err.message })
    return false
  }
}

async function main() {
  logger.info('Building 12 template variants (2 per category)...')

  let created = 0
  for (const cat of CATEGORIES) {
    const heroOk = copyHeroFirst(cat)
    const contentOk = createContentFirstVariant(cat)
    if (heroOk) created++
    if (contentOk) created++
  }

  logger.info(`✓ Created ${created}/12 variants. Generator will now randomly pick variants per site.`)
}

main().catch(err => {
  logger.error('Fatal', { error: err.message })
  process.exit(1)
})
