/**
 * images.js
 *
 * Resolves gallery and hero images for generated sites.
 *
 * Gallery resolution chain (per business):
 *  1. Unsplash Search API  — live, relevant, category + city aware
 *  2. Pexels Search API    — fallback if Unsplash fails or is rate-limited
 *  3. Hardcoded pool       — static Unsplash CDN URLs, always available
 *
 * Hero resolution chain:
 *  1. DALL-E 3             — custom AI-generated (requires OPENAI_API_KEY, paid tier only)
 *  2. Hardcoded pool       — deterministic per slug (stable across regenerations)
 *
 * Gallery images are fetched live so each business gets contextually relevant,
 * unique photos. Results are shuffled deterministically by slug so the same
 * business always gets the same photo order on regeneration.
 */

import { logger } from '../utils/logger.js'

const UNSPLASH_KEY      = process.env.UNSPLASH_API_KEY || ''
const PEXELS_KEY        = process.env.PEXELS_API_KEY   || ''
const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY || ''

// Circuit breaker: once Unsplash returns an auth/rate error we stop calling it
// for the rest of the process (avoids wasting a 403 round-trip on every image).
let unsplashDisabled = false

// ── Category-aware search query pools ────────────────────────────────────────
// IMPORTANT: queries are deliberately PEOPLE-FREE — interiors, tools, products,
// process and close-up details only. Global stock libraries have almost no
// Filipino-specific imagery, so any photo with people risks looking the wrong
// nationality (Indian/Western models on a Manila salon). Object/interior shots
// are culturally neutral and stay relevant. Real local imagery comes from the
// business's own Google photos (see fetchGooglePlacesPhotos / businessPhoto).
const GALLERY_QUERIES = {
  trades: [
    'workshop tools organized workbench closeup',
    'power tools equipment garage interior',
    'home renovation interior work materials',
    'auto repair garage bay lift interior',
    'construction materials site equipment detail',
  ],
  restaurant: [
    'plated dish food close-up presentation',
    'restaurant interior empty tables ambiance',
    'fresh ingredients cooking detail closeup',
    'café counter coffee interior cozy',
    'food spread table overhead flatlay',
  ],
  salon: [
    'salon interior styling chairs mirrors empty',
    'nail art manicure close-up detail',
    'hair color products styling tools flatlay',
    'spa massage stones towels candles detail',
    'beauty treatment products skincare closeup',
  ],
  medical: [
    'modern clinic interior clean empty',
    'medical equipment instruments detail',
    'dental chair clinic interior modern',
    'pharmacy shelves medicine interior',
    'clinic reception waiting area interior',
  ],
  legal: [
    'law office interior bookshelf desk empty',
    'legal books documents desk detail',
    'modern office boardroom interior',
    'contract papers pen desk closeup',
    'professional office interior city view',
  ],
  retail: [
    'boutique interior product display shelves',
    'retail store merchandise display detail',
    'product flatlay clean minimal arrangement',
    'shop interior modern shelving empty',
    'storefront window display retail',
  ],
  generic: [
    'cozy local shop interior empty welcoming',
    'small business storefront exterior street',
    'neighborhood store counter interior warm',
    'independent shop front signage detail',
    'local business interior modern clean',
  ],
}

const HERO_QUERIES = {
  trades:     'workshop garage interior tools clean',
  restaurant: 'restaurant interior empty elegant ambiance',
  salon:      'salon interior styling stations mirrors',
  medical:    'modern medical clinic interior reception',
  legal:      'law office interior bookshelf professional',
  retail:     'boutique retail store interior display',
  generic:    'charming local shop storefront interior',
}

// People-free, atmospheric video queries for the decorative ambiance band.
// Motion/mood only — never replaces the real business hero photo.
const VIDEO_QUERIES = {
  trades:     'workshop tools machine sparks closeup',
  restaurant: 'restaurant cooking flame food closeup',
  salon:      'spa water candles relaxing ambiance',
  medical:    'modern clinic interior calm clean',
  legal:      'city skyline buildings timelapse',
  retail:     'boutique products display interior',
  generic:    'city street lights ambiance evening',
}

// ── Hardcoded fallback pool ───────────────────────────────────────────────────
const STATIC_POOL = {
  restaurant: {
    hero: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=1600&auto=format&fit=crop',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&auto=format&fit=crop',
    ],
  },
  trades: {
    hero: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&auto=format&fit=crop',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1545259742-f9e8f9a9f3e1?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop',
    ],
  },
  salon: {
    hero: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1600&auto=format&fit=crop',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1487412947147-5cebf100d293?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1470259078422-826894b933aa?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&auto=format&fit=crop',
    ],
  },
  medical: {
    hero: [
      'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551076805-e1869033e561?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?w=1600&auto=format&fit=crop',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1530026405186-ed1f139313f3?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=600&auto=format&fit=crop',
    ],
  },
  legal: {
    hero: [
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=1600&auto=format&fit=crop',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521791055366-0d553872952f?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&auto=format&fit=crop',
    ],
  },
  retail: {
    hero: [
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&auto=format&fit=crop',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1525904097878-94fb15835963?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=600&auto=format&fit=crop',
    ],
  },
  generic: {
    hero: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1462826303086-329426d1aef5?w=1600&auto=format&fit=crop',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=600&auto=format&fit=crop',
    ],
  },
  barbershop: {
    hero: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&auto=format&fit=crop',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580518337843-f959e992563b?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1567894340315-735d7c361db0?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1634302086687-ee4fae17a786?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541533848490-bc8115cd6522?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512864084360-7c0d369d9a74?w=600&auto=format&fit=crop',
    ],
  },
  auto: {
    hero: [
      'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=1600&auto=format&fit=crop',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=600&auto=format&fit=crop',
    ],
  },
}

const AUTO_KEYWORDS         = ['auto', 'car', 'vehicle', 'mechanic', 'garage', 'tyre', 'tire', 'motor', 'motorcycle', 'moto', 'transmission', 'brake', 'vulcaniz']
const CONSTRUCTION_KEYWORDS = ['construction', 'builder', 'contractor', 'renovation', 'architect', 'concrete', 'structural']
const BARBER_KEYWORDS       = ['barber', 'barbershop', 'shave', 'grooming']

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickStaticBank(categoryKey, business) {
  const haystack = [business.name, business.category, business.raw_data?.description || '']
    .join(' ').toLowerCase()

  if (AUTO_KEYWORDS.some(kw => haystack.includes(kw)))   return STATIC_POOL.auto
  if (CONSTRUCTION_KEYWORDS.some(kw => haystack.includes(kw))) return STATIC_POOL.trades
  if (BARBER_KEYWORDS.some(kw => haystack.includes(kw))) return STATIC_POOL.barbershop
  return STATIC_POOL[categoryKey] || STATIC_POOL.generic
}

function slugSeed(slug) {
  return slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
}

// The business's own Google Maps photo (from Serper's thumbnailUrl). It's a
// real photo of THIS business — the most relevant image possible. Google CDN
// URLs accept a size suffix, so we request a hero-sized version.
function businessPhoto(business, width = 1600, height = 1000) {
  const url = business?.raw_data?.photo_url
  if (!url) return null
  if (url.includes('googleusercontent.com') || url.includes('ggpht.com')) {
    return `${url.split('=')[0]}=w${width}-h${height}`
  }
  return url
}

// Deterministic Fisher-Yates shuffle — same seed = same order every time
function shuffleWithSeed(arr, seed) {
  const result = [...arr]
  let s = seed
  for (let i = result.length - 1; i > 0; i--) {
    s = Math.imul(s ^ (s >>> 13), s | 1) ^ (s ^ (s << 8))
    const j = Math.abs(s) % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Business-specific query overrides — checked before category queries
// Ordered from most specific to most general
const SPECIFIC_QUERIES = [
  { kw: ['paint', 'painting', 'painter'],               q: 'house painting exterior painter brush wall' },
  { kw: ['plumb', 'plumbing', 'plumber', 'pipe'],       q: 'plumber plumbing pipes repair professional' },
  { kw: ['electr', 'electrician', 'wiring'],            q: 'electrician electrical wiring installation panel' },
  { kw: ['landscap', 'lawn', 'mow', 'garden', 'turf'], q: 'landscaping lawn mowing garden outdoor green' },
  { kw: ['roof', 'shingle'],                            q: 'roofing contractor roof installation shingles' },
  { kw: ['hvac', 'air condition', 'heat', 'cool', 'aircon'], q: 'HVAC air conditioning heating unit installation' },
  { kw: ['clean', 'janitorial', 'maid', 'housekeep'],  q: 'professional cleaning service spotless home' },
  { kw: ['carpet', 'flooring', 'hardwood', 'tile'],     q: 'flooring installation hardwood tile carpet interior' },
  { kw: ['auto', 'car', 'vehicle', 'mechanic', 'tire', 'tyre', 'brake'], q: 'auto repair mechanic car garage workshop' },
  { kw: ['pest', 'exterminat', 'termite'],              q: 'pest control exterminator spraying professional' },
  { kw: ['drywall', 'plaster', 'stucco'],               q: 'drywall installation plastering interior finishing' },
  { kw: ['concrete', 'masonry', 'paving', 'driveways'], q: 'concrete masonry driveway paving construction' },
  { kw: ['weld', 'fabricat', 'metal'],                  q: 'welding metal fabrication workshop sparks' },
  { kw: ['remodel', 'renovate', 'construct', 'build'],  q: 'home renovation remodeling construction interior' },
  { kw: ['move', 'moving', 'mover', 'storage'],         q: 'professional movers moving boxes truck loading' },
  { kw: ['pizza', 'pasta', 'italian'],                  q: 'italian restaurant pizza pasta food dining' },
  { kw: ['sushi', 'japanese', 'ramen'],                 q: 'japanese restaurant sushi ramen food presentation' },
  { kw: ['burger', 'grill', 'bbq', 'barbeque'],        q: 'burger grill barbecue restaurant food' },
  { kw: ['bakery', 'cake', 'pastry', 'bread'],          q: 'bakery pastry cake bread artisan baked goods' },
  { kw: ['cafe', 'coffee', 'espresso'],                 q: 'cafe coffee shop espresso barista interior' },
  { kw: ['dental', 'dentist', 'teeth'],                 q: 'dental clinic dentist teeth health professional' },
  { kw: ['pharmacy', 'drug'],                           q: 'pharmacy medicine health professional store' },
  { kw: ['barber', 'barbershop', 'shave'],              q: 'barbershop barber chair grooming men style' },
  { kw: ['nail', 'manicure', 'pedicure'],               q: 'nail salon manicure pedicure beauty spa' },
  { kw: ['spa', 'massage', 'wellness'],                 q: 'spa massage wellness relaxation treatment' },
]

// Pick a STOCK query for this category. Uses only the curated people-free pool
// (the SPECIFIC_QUERIES map could imply people — "barber men", "barista" — which
// risks the wrong nationality on stock). Real/local imagery comes from the
// business's own Google photos; stock is the safe, people-free fallback.
function pickGalleryQuery(categoryKey, business, seed) {
  const queries = GALLERY_QUERIES[categoryKey] || GALLERY_QUERIES.generic
  return queries[seed % queries.length]
}

// ── Live API fetchers ─────────────────────────────────────────────────────────

async function fetchUnsplashGallery(query, count, seed) {
  if (!UNSPLASH_KEY || unsplashDisabled) return null

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${Math.min(count * 2, 20)}&orientation=landscape&content_filter=high`
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
      signal:  AbortSignal.timeout(6000),
    })

    if (!res.ok) {
      // Auth / rate failure → disable Unsplash for the rest of this run.
      if (res.status === 401 || res.status === 403) {
        unsplashDisabled = true
        logger.warn(`[Images] Unsplash disabled this run (HTTP ${res.status}) — replace UNSPLASH_API_KEY (a fresh free access key) to re-enable; falling back to Pexels`)
      } else {
        logger.warn(`[Images] Unsplash API error ${res.status} for query "${query}"`)
      }
      return null
    }

    const data = await res.json()
    if (!data.results?.length) return null

    // Shuffle the result pool deterministically, then take the first `count`
    const urls = data.results.map(p => p.urls.regular)
    return shuffleWithSeed(urls, seed).slice(0, count)
  } catch (err) {
    logger.warn(`[Images] Unsplash fetch failed: ${err.message}`)
    return null
  }
}

async function fetchPexelsGallery(query, count, seed) {
  if (!PEXELS_KEY) return null

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${Math.min(count * 2, 20)}&orientation=landscape`
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_KEY },
      signal:  AbortSignal.timeout(6000),
    })

    if (!res.ok) {
      logger.warn(`[Images] Pexels API error ${res.status} for query "${query}"`)
      return null
    }

    const data = await res.json()
    if (!data.photos?.length) return null

    const urls = data.photos.map(p => p.src.large)
    return shuffleWithSeed(urls, seed).slice(0, count)
  } catch (err) {
    logger.warn(`[Images] Pexels fetch failed: ${err.message}`)
    return null
  }
}

// Pexels stock video for the decorative ambiance band. Returns one HD mp4 URL
// (~1280px — good quality without a 4K payload), chosen deterministically by slug.
async function fetchPexelsVideo(query, seed = 0) {
  if (!PEXELS_KEY) return null
  try {
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape&size=medium`
    const res = await fetch(url, { headers: { Authorization: PEXELS_KEY }, signal: AbortSignal.timeout(7000) })
    if (!res.ok) { logger.warn(`[Images] Pexels video API ${res.status} for "${query}"`); return null }
    const data = await res.json()
    const vids = (data.videos || []).filter(v => (v.duration || 0) >= 5 && (v.duration || 0) <= 40)
    if (!vids.length) return null
    const v = vids[Math.abs(seed) % vids.length]
    const files = (v.video_files || []).filter(f => f.file_type === 'video/mp4')
    // Prefer an HD file between 1280–1920px wide; else the largest available.
    const hd = files.filter(f => (f.width || 0) >= 1280 && (f.width || 0) <= 1920)
                    .sort((a, b) => (a.width || 0) - (b.width || 0))[0]
    const pick = hd || files.sort((a, b) => (b.width || 0) - (a.width || 0))[0]
    return pick?.link || null
  } catch (err) {
    logger.warn(`[Images] Pexels video fetch failed: ${err.message}`)
    return null
  }
}

/**
 * Real photos of the business from Google Places (the business's OWN photos —
 * uniquely local, 100% relevant). Uses the placeId captured at crawl time.
 * Requires GOOGLE_PLACES_API_KEY. Returns up to `count` image URLs, or null.
 *
 * Flow (Places API v1): place details (photos[].name) → photo media
 * (?skipHttpRedirect=true returns JSON with photoUri).
 */
async function fetchGooglePlacesPhotos(placeId, count = 7, width = 1600) {
  if (!GOOGLE_PLACES_KEY || !placeId) return null
  try {
    const detailRes = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?key=${GOOGLE_PLACES_KEY}`,
      { headers: { 'X-Goog-FieldMask': 'photos' }, signal: AbortSignal.timeout(7000) }
    )
    if (!detailRes.ok) {
      logger.warn(`[Images] Google Places details HTTP ${detailRes.status} for ${placeId}`)
      return null
    }
    const detail = await detailRes.json()
    const photos = (detail.photos || []).slice(0, count)
    if (!photos.length) return null

    const urls = []
    for (const p of photos) {
      try {
        const mediaRes = await fetch(
          `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=${width}&skipHttpRedirect=true&key=${GOOGLE_PLACES_KEY}`,
          { signal: AbortSignal.timeout(7000) }
        )
        if (mediaRes.ok) {
          const m = await mediaRes.json()
          if (m.photoUri) urls.push(m.photoUri)
        }
      } catch { /* skip a single failed photo */ }
    }
    return urls.length ? urls : null
  } catch (err) {
    logger.warn(`[Images] Google Places photos failed for ${placeId}: ${err.message}`)
    return null
  }
}

/**
 * Provider-agnostic image fetch: try Unsplash first, fall back to Pexels with
 * the SAME query. Critical because a dead/expired Unsplash key (403) must not
 * discard the query — Pexels gets the exact same (Haiku-generated) query.
 */
async function fetchAnyGallery(query, count, seed) {
  let urls = await fetchUnsplashGallery(query, count, seed)
  if (!urls || urls.length === 0) {
    urls = await fetchPexelsGallery(query, count, seed)
  }
  return urls && urls.length ? urls : null
}

// ── DALL-E 3 hero (paid tier — activated by OPENAI_API_KEY) ──────────────────

async function generateDalleHero(business, categoryKey) {
  if (!process.env.OPENAI_API_KEY) return null

  try {
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const prompt = buildDallePrompt(business, categoryKey)
    logger.info(`[Images] Generating DALL-E hero for "${business.name}"`)

    const response = await openai.images.generate({
      model:   'dall-e-3',
      prompt,
      n:       1,
      size:    '1792x1024',
      quality: 'standard',
    })

    const url = response.data[0]?.url
    if (url) logger.info(`[Images] DALL-E hero generated for "${business.name}"`)
    return url || null
  } catch (err) {
    logger.warn(`[Images] DALL-E failed — falling back`, { error: err.message })
    return null
  }
}

function buildDallePrompt(business, categoryKey) {
  const prompts = {
    restaurant: `A warm, inviting interior of a ${business.category || 'restaurant'} in ${business.city || 'a city'}. Professional food photography style, shallow depth of field, golden hour lighting, no people, no text.`,
    trades:     `A professional tradesperson's clean, modern workshop or job site in ${business.city || 'a city'}. Tools visible, bright lighting, high quality. No people, no text, no logos.`,
    salon:      `A modern, elegant hair salon interior. Stylish chairs, soft lighting, clean lines, luxurious feel. No people, no text, photorealistic.`,
    medical:    `A clean, modern medical clinic reception area in ${business.city || 'a city'}. Bright, calm, professional. Plants, soft lighting. No people, no text.`,
    legal:      `A prestigious law office interior. Dark wood, books, city view window, soft ambient lighting. Professional and authoritative. No people, no text.`,
    retail:     `A well-merchandised boutique retail shop interior. Clean displays, warm lighting, inviting atmosphere. No people, no text.`,
    auto:       `A clean, modern auto repair garage interior. Organised tools, a lifted car, bright workshop lighting, professional. No people, no text.`,
    generic:    `A modern, professional local business storefront or office exterior in ${business.city || 'a city'}. Clean, welcoming, daytime. No text, no logos.`,
  }
  return prompts[categoryKey] || prompts.generic
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Resolves the best available images for a business.
 *
 * Gallery chain: Unsplash API → Pexels API → static pool
 * Hero chain:    DALL-E 3 (paid) → Unsplash (spec query) → static pool
 *
 * @param {string} categoryKey
 * @param {object} business
 * @param {object|null} specQueries — from content_spec: { hero, gallery: [q1, q2, q3] }
 *   When provided the spec's targeted queries replace the keyword-matched ones,
 *   giving each business visually distinct, relevant photos.
 *
 * Returns { heroUrl, galleryUrls, source }
 */
export async function resolveImages(categoryKey, business, specQueries = null) {
  const seed       = slugSeed(business.slug || business.name || 'default')
  const staticBank = pickStaticBank(categoryKey, business)

  const hasImageApi = Boolean(UNSPLASH_KEY || PEXELS_KEY)

  // ── Real business photos (Google Places) — fetched once, used for hero + gallery ──
  // These are the business's OWN photos: uniquely local (Filipino), 100% relevant.
  // High-res via Places API when GOOGLE_PLACES_API_KEY is set.
  let placesPhotos = null
  if (GOOGLE_PLACES_KEY && business.raw_data?.place_id) {
    placesPhotos = await fetchGooglePlacesPhotos(business.raw_data.place_id, 7, 1600)
    if (placesPhotos?.length) logger.info(`[Images] ${placesPhotos.length} real Google Places photos for "${business.name}"`)
  }

  // ── Hero: DALL-E → Places photo → Serper thumbnail → spec stock → static ──
  const dalleUrl = await generateDalleHero(business, categoryKey)
  let heroUrl    = dalleUrl
  let heroSource = dalleUrl ? 'dalle' : null

  if (!heroUrl && placesPhotos?.length) {
    heroUrl = placesPhotos[0]
    heroSource = 'google-places'
  }

  // Fallback to the lower-res Serper thumbnail (still a real photo of the business).
  if (!heroUrl) {
    const photo = businessPhoto(business)
    if (photo) {
      heroUrl = photo
      heroSource = 'google-thumbnail'
      logger.info(`[Images] Hero = real Google photo of "${business.name}"`)
    }
  }

  // Stock fallback hero — people-free category query (never the free-form spec query).
  if (!heroUrl && hasImageApi) {
    const q = HERO_QUERIES[categoryKey] || HERO_QUERIES.generic
    const results = await fetchAnyGallery(q, 2, seed)
    heroUrl = results?.[0] || null
    if (heroUrl) { heroSource = 'stock'; logger.info(`[Images] Hero via people-free stock for "${business.name}" — "${q}"`) }
  }

  if (!heroUrl) { heroUrl = staticBank.hero[seed % staticBank.hero.length]; heroSource = 'static' }

  // ── Gallery: REAL Places photos → spec stock → keyword stock → static ────
  // Real business photos are people-true and uniquely local; stock is the
  // people-free fallback. A dead Unsplash key never forces the generic path.
  let galleryUrls  = null
  let gallerySource = 'static'

  // Prefer the business's own remaining Google photos for the gallery.
  if (placesPhotos && placesPhotos.length >= 4) {
    galleryUrls   = placesPhotos.slice(1, 7)   // [0] is the hero
    gallerySource = 'google-places'
    logger.info(`[Images] Gallery = ${galleryUrls.length} real Google photos of "${business.name}"`)
  }

  // Stock fallback gallery — people-free category pool only.
  if (!galleryUrls && hasImageApi) {
    const query = pickGalleryQuery(categoryKey, business, seed)
    galleryUrls = await fetchAnyGallery(query, 6, seed)
    if (galleryUrls) {
      gallerySource = 'keyword'
      logger.info(`[Images] Keyword gallery (${galleryUrls.length} photos) for "${business.name}" — "${query}"`)
    }
  }

  if (!galleryUrls) {
    galleryUrls   = shuffleWithSeed(staticBank.gallery, seed)
    gallerySource = 'static'
    logger.debug(`[Images] Static gallery fallback for "${business.name}"`)
  }

  // Decorative ambiance video (people-free, atmospheric — never the hero).
  const videoUrl = await fetchPexelsVideo(VIDEO_QUERIES[categoryKey] || VIDEO_QUERIES.generic, seed)
  if (videoUrl) logger.info(`[Images] Ambiance video for "${business.name}"`)

  return {
    heroUrl,
    galleryUrls,
    videoUrl,
    source: dalleUrl ? 'dalle+' + gallerySource : gallerySource,
  }
}
