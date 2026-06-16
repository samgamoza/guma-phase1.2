/**
 * images.js
 *
 * Provides high-quality, royalty-free image URLs for generated sites.
 *
 * Strategy (in priority order):
 *  1. DALL-E 3 — generates a custom hero image for the exact business (requires OPENAI_API_KEY)
 *  2. Unsplash curated — hand-picked, category-matched photos (always available, no key needed)
 *
 * Unsplash URLs use the /photo/:id/download?w=1600 format which serves the image
 * directly from Unsplash CDN without requiring an API key.
 */

import { logger } from '../utils/logger.js'

// ── Curated Unsplash photo banks per category ─────────────────────────────────
// Each entry: { hero, gallery[] }
const UNSPLASH = {
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

  // Barbershop — override salon bank with barber-specific photos
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

  // Auto Repair — common enough to deserve its own bank
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

// Auto / moto repair keywords for bank selection
const AUTO_KEYWORDS = ['auto', 'car', 'vehicle', 'mechanic', 'garage', 'tyre', 'tire', 'motor', 'motorcycle', 'moto', 'transmission', 'brake', 'vulcaniz']

const CONSTRUCTION_KEYWORDS = ['construction', 'builder', 'contractor', 'renovation', 'architect', 'concrete', 'structural']

/**
 * Pick the best Unsplash photo bank for a business.
 */
function pickBank(categoryKey, business) {
  const haystack = [business.name, business.category, business.raw_data?.description || '']
    .join(' ').toLowerCase()

  if (AUTO_KEYWORDS.some(kw => haystack.includes(kw))) return UNSPLASH.auto
  if (CONSTRUCTION_KEYWORDS.some(kw => haystack.includes(kw))) return UNSPLASH.trades
  const BARBER_KEYWORDS = ['barber', 'barbershop', 'shave', 'grooming']
  if (BARBER_KEYWORDS.some(kw => haystack.includes(kw))) return UNSPLASH.barbershop
  return UNSPLASH[categoryKey] || UNSPLASH.generic
}

/**
 * Pick a deterministic hero photo (based on slug so it's stable across regenerations)
 * and return all 6 gallery photos.
 */
function pickUnsplashImages(categoryKey, business) {
  const bank = pickBank(categoryKey, business)
  const slugSum = business.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const heroUrl = bank.hero[slugSum % bank.hero.length]
  return { heroUrl, galleryUrls: bank.gallery }
}

/**
 * Optionally generate a custom hero image with DALL-E 3.
 * Only runs if OPENAI_API_KEY is set. Falls back to Unsplash silently.
 */
async function generateDalleHero(business, categoryKey) {
  if (!process.env.OPENAI_API_KEY) return null

  try {
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const prompt = buildDallePrompt(business, categoryKey)
    logger.info(`Generating DALL-E hero for "${business.name}"`)

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
    })

    const url = response.data[0]?.url
    if (url) logger.info(`DALL-E hero generated for "${business.name}"`)
    return url || null
  } catch (err) {
    logger.warn(`DALL-E generation failed — falling back to Unsplash`, { error: err.message })
    return null
  }
}

function buildDallePrompt(business, categoryKey) {
  const prompts = {
    restaurant: `A warm, inviting interior of a ${business.category || 'restaurant'} in ${business.city || 'a city'}. Professional food photography style, shallow depth of field, golden hour lighting, no people, no text.`,
    trades: `A professional tradesperson's clean, modern workshop or job site. Tools visible, bright lighting, high quality. No people, no text, no logos.`,
    salon: `A modern, elegant hair salon interior. Stylish chairs, soft lighting, clean lines, luxurious feel. No people, no text, photorealistic.`,
    medical: `A clean, modern medical or dental clinic reception area. Bright, calm, professional. Plants, soft lighting. No people, no text.`,
    legal: `A prestigious law office interior. Dark wood, books, city view window, soft ambient lighting. Professional and authoritative. No people, no text.`,
    retail: `A well-merchandised boutique retail shop interior. Clean displays, warm lighting, inviting atmosphere. No people, no text.`,
    auto: `A clean, modern auto repair garage interior. Organised tools, a lifted car, bright workshop lighting, professional. No people, no text.`,
    generic: `A modern, professional local business storefront or office exterior in ${business.city || 'a city'}. Clean, welcoming, daytime. No text, no logos.`,
  }
  return prompts[categoryKey] || prompts.generic
}

/**
 * Main export — resolves the best images for a business.
 * Returns { heroUrl, galleryUrls, source: 'dalle' | 'unsplash' }
 */
export async function resolveImages(categoryKey, business) {
  const dalleUrl = await generateDalleHero(business, categoryKey)
  const { heroUrl: unsplashHero, galleryUrls } = pickUnsplashImages(categoryKey, business)

  return {
    heroUrl: dalleUrl || unsplashHero,
    galleryUrls,
    source: dalleUrl ? 'dalle' : 'unsplash',
  }
}
