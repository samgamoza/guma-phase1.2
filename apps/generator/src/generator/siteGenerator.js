import Anthropic from '@anthropic-ai/sdk'
import { resolveCategory } from '../templates/categories.js'
import { buildSystemPrompt, buildUserPrompt } from './prompts.js'
import { resolveImages } from './images.js'
import { logger } from '../utils/logger.js'
import { createClient } from '@supabase/supabase-js'

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 32000  // multilingual + conversion sections need more room
const MAX_RETRIES = 2

/**
 * SiteGenerator
 *
 * Wraps the Anthropic SDK to:
 *  1. Resolve the right category + theme for a business
 *  2. Build the system + user prompts
 *  3. Call Claude claude-sonnet-4-6
 *  4. Validate and clean the HTML response
 *  5. Return a GeneratedSite object ready for DB storage
 */
export class SiteGenerator {
  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    this.systemPrompt = buildSystemPrompt()
    // Initialize Supabase with Service Key for backend storage access
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )
  }

  /**
   * Main entry.
   * @param {object} business — row from the businesses table
   * @returns {GeneratedSite}
   */
  async generate(business) {
    const { key: categoryKey, config: categoryConfig } = resolveCategory(business)

    logger.info(`Generating site for "${business.name}"`, {
      slug: business.slug,
      category: categoryKey,
    })

    const images = await resolveImages(categoryKey, business)
    logger.info(`Images resolved via ${images.source}`, { hero: images.heroUrl })

    const userPrompt = buildUserPrompt({ business, categoryKey, categoryConfig, images })

    let html = null
    let lastError = null

    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        html = await this._callClaude(userPrompt)
        break
      } catch (err) {
        lastError = err
        if (attempt <= MAX_RETRIES) {
          logger.warn(`Generation attempt ${attempt} failed — retrying`, {
            business: business.slug,
            error: err.message,
          })
          await sleep(attempt * 3000)
        }
      }
    }

    if (!html) {
      throw new Error(`Generation failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`)
    }

    html = this._cleanHtml(html, business)
    this._validateHtml(html, business.slug)

    // ── Save to Supabase Storage ──────────────────────────────────────────
    const bucketName = process.env.SUPABASE_SITES_BUCKET || 'generated-sites'
    const storagePath = `previews/${business.slug}.html`

    const { error: storageError } = await this.supabase.storage
      .from(bucketName)
      .upload(storagePath, html, {
        contentType: 'text/html',
        upsert: true,
      })

    if (storageError) {
      logger.error(`Storage upload failed for ${business.slug}`, storageError)
      throw new Error(`Failed to save site to storage: ${storageError.message}`)
    }

    // Get the public URL for the preview (assumes bucket is public)
    const { data: { publicUrl } } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath)

    return {
      businessId: business.id,
      slug: business.slug,
      storagePath,
      publicUrl,
      categoryKey,
      theme: categoryConfig.theme,
      sections: categoryConfig.sections,
      generatedAt: new Date().toISOString(),
      tokenEstimate: Math.round(html.length / 4),
    }
  }

  /**
   * Calculates a lead score from 0-100 based on metadata quality.
   */
  _calculateLeadScore(business, categoryKey) {
    let score = 0
    const rd = business.raw_data || {}

    // 1. Social Proof (Max 40 pts)
    const reviews = parseInt(rd.review_count || 0)
    if (reviews >= 200) score += 40
    else if (reviews >= 100) score += 30
    else if (reviews >= 20) score += 15

    // 2. Reputation (Max 20 pts)
    const rating = parseFloat(rd.rating || 0)
    if (rating >= 4.5) score += 20
    else if (rating >= 4.0) score += 10

    // 3. Contactability (Max 30 pts)
    if (business.email) score += 20 // Email is king for automation
    if (business.phone) score += 10

    // 4. Data Richness (Max 10 pts)
    const hasSocial = rd.social_links && Object.keys(rd.social_links).length > 0
    const hasServices = rd.services && rd.services.length > 0
    if (hasSocial) score += 5
    if (hasServices) score += 5

    return Math.min(100, score)
  }

  // ── Claude API call ───────────────────────────────────────────────────────

  async _callClaude(userPrompt) {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: this.systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    if (response.stop_reason === 'max_tokens') {
      logger.warn('Response hit max_tokens — closing HTML')
      // Append closing tags so validation doesn't fail on truncation
      const t = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
      if (!t.includes('</html>')) {
        return t + '\n</body></html>'
      }
    }

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')

    if (!text) throw new Error('Claude returned empty response')
    return text
  }

  // ── Post-processing ───────────────────────────────────────────────────────

  /**
   * Strip any markdown fences Claude occasionally wraps the HTML in,
   * inject the canonical <base> tag, and ensure the claim link slug is correct.
   */
  _cleanHtml(raw, business) {
    let html = raw.trim()

    // Remove markdown code fences (```html ... ``` or ``` ... ```)
    html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```\s*$/, '')

    // Ensure it starts with doctype
    if (!html.toLowerCase().startsWith('<!doctype')) {
      const idx = html.toLowerCase().indexOf('<!doctype')
      if (idx > 0) html = html.slice(idx)
    }

    // Inject meta tags if missing
    if (!html.includes('<meta name="viewport"')) {
      html = html.replace(
        '<head>',
        '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1">'
      )
    }
    if (!html.includes('<meta charset')) {
      html = html.replace('<head>', '<head>\n  <meta charset="UTF-8">')
    }

    // Ensure the claim link uses the correct slug
    html = html.replace(
      /https:\/\/guma\.ai\/claim\/[^\s"']+/g,
      `https://guma.ai/claim/${business.slug}`
    )

    // Inject a canonical URL
    const siteUrl = `${process.env.SITE_BASE_URL || 'https://guma.ai/sites'}/${business.slug}`
    if (!html.includes('<link rel="canonical"')) {
      html = html.replace(
        '</head>',
        `  <link rel="canonical" href="${siteUrl}">\n</head>`
      )
    }

    // Ensure mobile claim bar is fixed to the bottom
    if (html.includes('mobile-claim-bar')) {
      const barStyles = '\n  .mobile-claim-bar { position: fixed !important; bottom: 0 !important; left: 0; right: 0; z-index: 9999; }'
      if (html.includes('</style>')) {
        html = html.replace('</style>', `${barStyles}\n</style>`)
      }
    }

    return html
  }

  /**
   * Lightweight structural validation.
   * Throws if the HTML is clearly broken so we can retry.
   */
  _validateHtml(html, slug) {
    const checks = [
      ['<!doctype', 'Missing DOCTYPE'],
      ['<html', 'Missing <html> tag'],
      ['<head', 'Missing <head> tag'],
      ['<body', 'Missing <body> tag'],
      ['</html>', 'Missing closing </html>'],
      ['guma', 'Missing Guma AI branding'],
      ['mobile-claim-bar', 'Missing mobile claim bar'],
    ]

    for (const [needle, message] of checks) {
      if (!html.toLowerCase().includes(needle.toLowerCase())) {
        throw new Error(`HTML validation failed for ${slug}: ${message}`)
      }
    }

    // SEO check: Ensure no more than one <h1> tag exists
    const h1Matches = html.match(/<h1/gi) || []
    if (h1Matches.length > 1) {
      throw new Error(`HTML validation failed for ${slug}: Multiple <h1> tags found (${h1Matches.length})`)
    }

    if (html.length < 3000) {
      throw new Error(`HTML suspiciously short for ${slug}: ${html.length} chars`)
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
