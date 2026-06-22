/**
 * siteChecker.js
 *
 * Lightweight website quality detector. Uses a plain HTTP fetch (no browser)
 * to check a handful of signals that indicate an old or neglected website.
 *
 * 0–1 signals → 'modern'   (skip — not a Guma lead)
 * 2+  signals → 'outdated' (include as hot lead)
 * fetch fails → 'dead'     (include — site is broken, strong lead)
 */

import { logger } from '../utils/logger.js'

const FETCH_TIMEOUT_MS = 6000

const OLD_GENERATORS = /wordpress\s[1-4]\.|joomla\s1\.|drupal\s[4-7]\.|frontpage|dreamweaver/i
const OLD_COPYRIGHT  = /©|\(c\)|copyright[^<]{0,30}(199\d|200\d|201[0-6])/i

/**
 * Check a single URL for staleness signals.
 * @returns {{ quality: 'modern'|'outdated'|'dead', signals: string[], responseMs: number }}
 */
export async function checkWebsiteQuality(url) {
  if (!url) return { quality: 'none', signals: [], responseMs: 0 }

  const signals = []
  let responseMs = 0

  try {
    const start = Date.now()
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    })
    responseMs = Date.now() - start

    const finalUrl = res.url || url
    const html = await res.text()

    // 1. No HTTPS
    if (!finalUrl.startsWith('https://')) signals.push('no_https')

    // 2. No mobile viewport meta tag
    if (!/name=["']viewport["']/i.test(html)) signals.push('no_viewport')

    // 3. Old CMS generator tag
    const genMatch = html.match(/<meta[^>]+name=["']generator["'][^>]*>/i)
    if (genMatch && OLD_GENERATORS.test(genMatch[0])) signals.push('old_cms')

    // 4. Old copyright year in footer area
    if (OLD_COPYRIGHT.test(html.slice(-5000))) signals.push('old_copyright')

    // 5. Flash content
    if (/\.swf["'\s>]/i.test(html) || (/<object/i.test(html) && /flash/i.test(html))) {
      signals.push('has_flash')
    }

    // 6. Table-based layout (5+ table tags = layout tables, not data)
    if ((html.match(/<table/gi) || []).length >= 5) signals.push('table_layout')

    // 7. Very slow response
    if (responseMs > 4000) signals.push('slow_response')

    const quality = signals.length >= 2 ? 'outdated' : 'modern'
    return { quality, signals, responseMs }

  } catch {
    // Site unreachable, timed out, SSL error etc — treat as dead/broken
    return { quality: 'dead', signals: ['unreachable'], responseMs }
  }
}

/**
 * Check a batch of businesses-with-websites concurrently (max 5 at a time).
 * Mutates each business object by merging quality info into raw_data.
 * Returns the subset that qualify as hot leads (outdated or dead).
 */
export async function checkBatchQuality(businesses, { concurrency = 5 } = {}) {
  const hotLeads = []
  const queue = [...businesses]

  async function worker() {
    while (queue.length > 0) {
      const biz = queue.shift()
      const url = biz.raw_data?.website_url
      if (!url) continue

      try {
        const result = await checkWebsiteQuality(url)
        biz.raw_data = {
          ...biz.raw_data,
          website_quality: result.quality,
          website_signals: result.signals,
          website_response_ms: result.responseMs,
          lead_priority: result.quality === 'modern' ? 'skip' : 'hot',
        }

        if (result.quality === 'outdated' || result.quality === 'dead') {
          hotLeads.push(biz)
          logger.debug(`Hot lead detected: ${biz.name} (${result.signals.join(', ')})`)
        }
      } catch (err) {
        logger.debug(`Quality check failed for ${biz.name}: ${err.message}`)
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  return hotLeads
}
