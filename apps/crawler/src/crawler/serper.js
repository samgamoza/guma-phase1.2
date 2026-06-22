/**
 * SerperScraper
 *
 * Uses Serper.dev Google Maps API to find local businesses.
 * Returns the Google local pack results (~10 per query).
 *
 * To maximise results for a city, the scraper runs multiple
 * neighbourhood/area sub-queries automatically and deduplicates.
 *
 * API docs: https://serper.dev/
 * Required env: SERPER_API_KEY
 * Cost: ~$0.001 per search (50 results per credit at scale)
 */

import slugify from 'slugify'
import { logger } from '../utils/logger.js'

const SERPER_URL = 'https://google.serper.dev/maps'

// Sub-area suffixes to broaden results beyond the top-10 local pack.
// Each suffix becomes a separate query: "Restaurants downtown Dallas TX" etc.
const AREA_SUFFIXES = [
  '',
  'downtown',
  'north',
  'south',
  'east side',
  'west side',
  'midtown',
  'uptown',
  'near me',
]

export class SerperScraper {
  constructor() {
    this.apiKey = process.env.SERPER_API_KEY
    if (!this.apiKey) throw new Error('Missing SERPER_API_KEY')
  }

  /**
   * Main entry — mirrors YellowPagesScraper.scrapeSearch() signature.
   * maxPages maps to number of sub-area queries (each returns ~10 results).
   */
  async scrapeSearch({ category, city, state, maxPages = 5 }) {
    const label = `${category} / ${city}, ${state}`
    logger.info(`[Serper] Starting search: ${label}`)

    // Detect Philippines vs US for geo-targeting
    const isPhilippines = state === 'Metro Manila' || city === 'Metro Manila' ||
      ['Makati', 'Taguig', 'Quezon City', 'Manila', 'Pasig', 'Mandaluyong',
       'Pasay', 'Paranaque', 'Las Pinas', 'Muntinlupa', 'Pasig City'].includes(city)
    const gl      = isPhilippines ? 'ph' : 'us'
    const country = isPhilippines ? 'PH' : 'US'

    const suffixes = AREA_SUFFIXES.slice(0, Math.max(1, maxPages))
    const seen = new Set()
    const businesses = []

    for (const suffix of suffixes) {
      const query = suffix
        ? `${category} ${suffix} ${city} ${state}`
        : `${category} ${city} ${state}`

      try {
        const results = await this._search(query, gl)
        for (const r of results) {
          const key = r.cid || r.title + r.address
          if (seen.has(key)) continue
          seen.add(key)

          const biz = this._normalise(r, city, state, country)
          if (biz) businesses.push(biz)
        }
        logger.debug(`[Serper] "${query}" → ${results.length} results`)
      } catch (err) {
        logger.warn(`[Serper] Query failed: "${query}"`, { error: err.message })
      }

      // Polite delay between sub-queries
      if (suffixes.indexOf(suffix) < suffixes.length - 1) {
        await new Promise((r) => setTimeout(r, 500))
      }
    }

    // ── Email extraction: visit each business website to find contact email ──
    const withWebsite = businesses.filter(b => b.raw_data?.website_url)
    if (withWebsite.length > 0) {
      logger.info(`[Serper] Extracting emails from ${withWebsite.length} business websites...`)
      await this._extractEmailsBatch(withWebsite, 3)
      const found = businesses.filter(b => b.email).length
      logger.info(`[Serper] Email extraction complete: ${found}/${businesses.length} businesses have email`)
    }

    logger.info(`[Serper] Returning ${businesses.length} unique businesses for ${label}`)
    return businesses
  }

  // ─── Single Serper /maps request ─────────────────────────────────────────

  async _search(query, gl = 'us') {
    const res = await fetch(SERPER_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, gl, hl: 'en' }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Serper HTTP ${res.status}: ${text.slice(0, 200)}`)
    }

    const data = await res.json()
    return data.places || []
  }

  // ─── Normalise Serper place to DB schema ─────────────────────────────────

  _normalise(place, fallbackCity, fallbackState, country = 'US') {
    const name = place.title?.trim()
    if (!name) return null

    // Serper returns address as a single string e.g. "123 Main St, Dallas, TX 75201"
    const address = place.address || null
    const { city, state } = this._parseAddress(address, fallbackCity, fallbackState)

    const hasWebsite = Boolean(place.website)

    const slug = slugify(`${name}-${city}-${state}`, {
      lower: true,
      strict: true,
      trim: true,
    }).substring(0, 120)

    return {
      name,
      slug,
      category:    this._resolveCategory(place.category || ''),
      phone:       place.phoneNumber || null,
      email:       null, // populated later by _extractEmailsBatch
      address,
      city,
      country,
      source_url:  place.website || (place.cid
        ? `https://maps.google.com/?cid=${place.cid}`
        : null),
      source_dir:  'serper',
      has_website: hasWebsite,
      raw_data: {
        state,
        description:  place.description || null,
        rating:       place.rating?.toString() || null,
        review_count: place.ratingCount || 0,
        website_url:  place.website || null,
        cid:          place.cid || null,
        category_raw: place.category || null,
        // Real photo of THIS business from Google Maps (100% relevant) + its
        // Google Place ID (unlocks the full high-res photo set via Places API).
        photo_url:    place.thumbnailUrl || null,
        place_id:     place.placeId || null,
      },
      crawled_at: new Date().toISOString(),
    }
  }

  // ─── Extract emails from business websites (runs concurrently) ────────────

  async _extractEmailsBatch(businesses, concurrency = 3) {
    for (let i = 0; i < businesses.length; i += concurrency) {
      await Promise.all(
        businesses.slice(i, i + concurrency).map(async (biz) => {
          const email = await this._extractEmailFromWebsite(biz.raw_data.website_url)
          if (email) {
            biz.email = email
            logger.debug(`[Serper] Email found for "${biz.name}": ${email}`)
          }
        })
      )
    }
  }

  async _extractEmailFromWebsite(websiteUrl) {
    if (!websiteUrl) return null
    const EMAIL_RE = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g
    const SKIP_DOMAINS = [
      'example.com', 'sentry.io', 'wix.com', 'wordpress.com', 'squarespace.com',
      'facebook.com', 'google.com', 'instagram.com', 'twitter.com', 'tiktok.com',
      'email.com', 'youremail.com', 'domain.com', 'company.com',
    ]

    const tryFetch = async (url) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
          redirect: 'follow',
        })
        clearTimeout(timer)
        if (!res.ok) return null
        return await res.text()
      } catch {
        clearTimeout(timer)
        return null
      }
    }

    const findEmail = (html) => {
      if (!html) return null
      // Prefer mailto: links (most explicit)
      const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i)
      if (mailtoMatch) {
        const e = mailtoMatch[1].toLowerCase()
        if (!SKIP_DOMAINS.some(d => e.endsWith('@' + d) || e.includes('@' + d))) return e
      }
      // Fallback: any email pattern in text
      const matches = [...html.matchAll(EMAIL_RE)].map(m => m[1].toLowerCase())
      return matches.find(e => !SKIP_DOMAINS.some(d => e.endsWith('@' + d) || e.includes('@' + d))) || null
    }

    try {
      // Try homepage first
      const homepage = await tryFetch(websiteUrl)
      const email = findEmail(homepage)
      if (email) return email

      // Try /contact page if homepage had no email
      const base = websiteUrl.replace(/\/$/, '')
      const contactHtml = await tryFetch(`${base}/contact`)
      return findEmail(contactHtml)
    } catch {
      return null
    }
  }

  // ─── Parse "123 Main St, Dallas, TX 75201" → { city, state } ────────────

  _parseAddress(address, fallbackCity, fallbackState) {
    if (!address) return { city: fallbackCity, state: fallbackState }

    // Match "City, ST zip" or "City, ST" at end of address string (US format)
    const match = address.match(/,\s*([^,]+),\s*([A-Z]{2})(?:\s+\d{5})?/)
    if (match) {
      return { city: match[1].trim(), state: match[2].trim() }
    }

    return { city: fallbackCity, state: fallbackState }
  }

  // ─── Map Serper category string to our label ──────────────────────────────

  _resolveCategory(raw) {
    if (!raw) return 'Local Business'
    const lower = raw.toLowerCase()

    const map = [
      [['restaurant', 'dining', 'eatery', 'bistro', 'diner', 'grill', 'steakhouse', 'sushi', 'pizza', 'taco', 'burger'], 'Restaurant'],
      [['cafe', 'coffee', 'bakery', 'pastry'], 'Cafe'],
      [['bar', 'pub', 'tavern', 'brewery', 'lounge'], 'Bar'],
      [['salon', 'hair', 'barber', 'beauty', 'nail'], 'Salon'],
      [['spa', 'massage', 'wellness'], 'Spa'],
      [['gym', 'fitness', 'crossfit', 'yoga', 'pilates'], 'Gym'],
      [['doctor', 'physician', 'medical', 'clinic', 'urgent care', 'hospital'], 'Medical'],
      [['dentist', 'dental', 'orthodont'], 'Dental'],
      [['lawyer', 'attorney', 'legal', 'law firm'], 'Legal'],
      [['accountant', 'accounting', 'cpa', 'bookkeeping', 'tax'], 'Accounting'],
      [['real estate', 'realtor', 'property'], 'Real Estate'],
      [['auto repair', 'mechanic', 'tire', 'oil change', 'transmission'], 'Auto Repair'],
      [['car dealer', 'auto dealer', 'dealership'], 'Auto Dealer'],
      [['electrician', 'electrical'], 'Electrician'],
      [['plumber', 'plumbing'], 'Plumber'],
      [['handyman', 'handymen', 'jack of all', 'home repair', 'fix it'], 'Handyman'],
      [['contractor', 'construction', 'builder', 'remodel'], 'Contractor'],
      [['painter', 'painting'], 'Painter'],
      [['roofing', 'roofer'], 'Roofing'],
      [['florist', 'flower'], 'Florist'],
      [['retail', 'store', 'shop', 'boutique'], 'Retail'],
      [['pharmacy', 'drug store'], 'Pharmacy'],
      [['vet', 'veterinary', 'animal hospital', 'pet'], 'Veterinary'],
      [['hotel', 'motel', 'inn', 'lodge', 'resort'], 'Hotel'],
      [['moving', 'mover', 'relocation'], 'Moving'],
      [['laundry', 'dry clean'], 'Laundry'],
      [['locksmith'], 'Locksmith'],
      [['insurance'], 'Insurance'],
      [['financial', 'bank', 'credit union', 'mortgage'], 'Financial'],
      [['cleaning', 'maid', 'janitorial'], 'Cleaning'],
      [['landscaping', 'lawn', 'gardening'], 'Landscaping'],
      [['pest control', 'exterminator'], 'Pest Control'],
      [['tutoring', 'school', 'academy', 'learning'], 'Education'],
      [['daycare', 'child care', 'preschool'], 'Childcare'],
    ]

    for (const [keywords, label] of map) {
      if (keywords.some((k) => lower.includes(k))) return label
    }

    return raw.length < 40 ? raw : 'Local Business'
  }
}
