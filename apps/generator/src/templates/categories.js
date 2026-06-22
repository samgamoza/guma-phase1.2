/**
 * CATEGORY_CONFIG
 *
 * Each entry drives:
 *  - which HTML template skeleton to use
 *  - color theme tokens injected into CSS
 *  - AI prompt hints (tone, sections, keywords)
 *  - primary CTA button text
 *  - trust signals (what social proof matters most)
 */

export const CATEGORY_CONFIG = {
  restaurant: {
    label: 'Restaurant / Food & Dining',
    match: [
      'restaurant', 'pizza', 'food', 'dining', 'cafe', 'café', 'coffee', 'bakery',
      'bar', 'grill', 'diner', 'bistro', 'sushi', 'thai', 'mexican',
      'chinese', 'italian', 'burger', 'sandwich', 'catering',
      // broader food terms — many businesses never say "restaurant"
      'noodle', 'ramen', 'pho', 'tea house', 'teahouse', 'milk tea', 'milktea',
      'dim sum', 'dimsum', 'eatery', 'kitchen', 'canteen', 'panciteria',
      'carinderia', 'lutong', 'silog', 'lugaw', 'pares', 'lechon', 'seafood',
      'bbq', 'barbecue', 'barbeque', 'steak', 'steakhouse', 'buffet', 'dessert',
      'snack', 'resto', 'food house', 'foodhouse', 'tapsilog', 'inasal',
      'pizzeria', 'pastry', 'patisserie', 'gelato', 'ice cream', 'creamery',
      'tavern', 'pub', 'brewery', 'wine', 'cocktail', 'deli',
    ],
    theme: {
      primary: '#C0392B',    // warm red
      secondary: '#E67E22',  // amber
      accent: '#F9E4B7',
      bg: '#FFFDF7',
      text: '#2C1A0E',
    },
    tone: 'warm, inviting, appetising. Focus on the food experience, atmosphere, and community.',
    sections: ['hero', 'about', 'menu_highlights', 'hours_location', 'contact'],
    cta: 'Order Now',
    cta_secondary: 'View Menu',
    trust_signals: ['star rating', 'number of reviews', 'years in business', 'cuisine type'],
    icon: '🍽️',
  },

  trades: {
    label: 'Trades / Home Services',
    match: [
      'plumber', 'plumbing', 'electrician', 'hvac', 'roofing', 'contractor',
      'handyman', 'landscaping', 'lawn', 'pest control', 'cleaning',
      'paint', 'painting', 'painter', 'flooring', 'carpet', 'moving', 'storage', 'garage',
      'construction', 'builder', 'renovation', 'aircon', 'welding', 'fabrication',
      'auto repair', 'mechanic', 'auto shop', 'tire', 'tyre', 'auto service',
      'remodel', 'drywall', 'masonry', 'concrete', 'paving', 'fencing',
    ],
    theme: {
      primary: '#1A5276',   // navy blue
      secondary: '#2E86C1',
      accent: '#D6EAF8',
      bg: '#F4F6F7',
      text: '#1C2833',
    },
    tone: 'professional, trustworthy, reliable. Emphasise speed, expertise, and local knowledge.',
    sections: ['hero', 'services', 'why_choose_us', 'service_area', 'contact'],
    cta: 'Get a Free Quote',
    cta_secondary: 'Call Now',
    trust_signals: ['licensed & insured badge', 'years of experience', 'service area', 'emergency availability'],
    icon: '🔧',
  },

  salon: {
    label: 'Salon / Beauty / Wellness',
    match: [
      'salon', 'hair', 'beauty', 'spa', 'nail', 'barber', 'barbershop',
      'waxing', 'massage', 'aesthetics', 'skin', 'lash', 'brow', 'tanning',
      'grooming', 'haircut', 'shave',
    ],
    theme: {
      primary: '#7D3C98',   // purple
      secondary: '#A569BD',
      accent: '#F5EEF8',
      bg: '#FDFBFF',
      text: '#2D1B33',
    },
    tone: 'elegant, luxurious, confidence-boosting. Focus on the self-care experience and results.',
    sections: ['hero', 'services', 'gallery_placeholder', 'booking_cta', 'contact'],
    cta: 'Book Appointment',
    cta_secondary: 'See Services',
    trust_signals: ['years of experience', 'specialties', 'star rating', 'certifications'],
    icon: '✂️',
  },

  medical: {
    label: 'Medical / Dental / Health',
    match: [
      'dentist', 'dental', 'doctor', 'medical', 'clinic', 'health',
      'optometrist', 'chiropractor', 'physical therapy', 'orthodontist',
      'pediatric', 'family practice', 'urgent care', 'pharmacy',
    ],
    theme: {
      primary: '#1A7A4A',   // medical green
      secondary: '#239B56',
      accent: '#D5F5E3',
      bg: '#F9FFFC',
      text: '#1B2631',
    },
    tone: 'calm, professional, reassuring. Emphasise patient care, qualifications, and comfort.',
    sections: ['hero', 'services', 'insurance_accepted', 'meet_the_team_placeholder', 'contact'],
    cta: 'Book Appointment',
    cta_secondary: 'New Patient Info',
    trust_signals: ['accepting new patients', 'insurance networks', 'years of practice', 'certifications'],
    icon: '🏥',
  },

  legal: {
    label: 'Legal / Financial',
    match: [
      'lawyer', 'attorney', 'law firm', 'legal', 'accountant', 'cpa',
      'financial advisor', 'insurance', 'notary', 'paralegal',
    ],
    theme: {
      primary: '#1C2833',   // dark navy
      secondary: '#2C3E50',
      accent: '#D5D8DC',
      bg: '#FAFAFA',
      text: '#17202A',
    },
    tone: 'authoritative, trustworthy, confident. Focus on expertise, results, and confidentiality.',
    sections: ['hero', 'practice_areas', 'about_attorney', 'consultation_cta', 'contact'],
    cta: 'Free Consultation',
    cta_secondary: 'Our Practice Areas',
    trust_signals: ['bar admission', 'years of practice', 'case types', 'fee structure'],
    icon: '⚖️',
  },

  retail: {
    label: 'Retail / Shop',
    match: [
      'shop', 'store', 'boutique', 'gift', 'clothing', 'apparel',
      'jewelry', 'furniture', 'hardware', 'electronics', 'books',
      'florist', 'flower', 'pet', 'toy',
    ],
    theme: {
      primary: '#2874A6',
      secondary: '#5DADE2',
      accent: '#EBF5FB',
      bg: '#FDFEFE',
      text: '#1A252F',
    },
    tone: 'friendly, enthusiastic, product-focused. Highlight selection, quality, and local charm.',
    sections: ['hero', 'featured_products', 'about_store', 'hours_location', 'contact'],
    cta: 'Shop Now',
    cta_secondary: 'Visit Us',
    trust_signals: ['years in business', 'product categories', 'local ownership', 'return policy'],
    icon: '🛍️',
  },

  // Fallback for uncategorised businesses
  generic: {
    label: 'Local Business',
    match: [],
    theme: {
      primary: '#2C3E50',
      secondary: '#34495E',
      accent: '#ECF0F1',
      bg: '#FAFAFA',
      text: '#1A252F',
    },
    tone: 'professional, approachable, clear. Highlight the business value and how to get in touch.',
    sections: ['hero', 'about', 'services', 'hours_location', 'contact'],
    cta: 'Get in Touch',
    cta_secondary: 'Learn More',
    trust_signals: ['years in business', 'star rating', 'address', 'phone'],
    icon: '🏢',
  },
}

/**
 * Count whole-word keyword matches in the haystack.
 * Whole-word (with optional plural) matching avoids substring false-positives:
 *   - "bar" must NOT match inside "barbers"  → \bbar(?:s|es)?\b doesn't match "barbers"
 *   - "barber" DOES match "barbers"          → \bbarber(?:s|es)?\b
 * Multi-word keywords ("tea house", "auto repair") match as phrases.
 */
function countCategoryMatches(haystack, keywords) {
  let score = 0
  for (const kw of keywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`\\b${escaped}(?:s|es)?\\b`, 'i').test(haystack)) score++
  }
  return score
}

/**
 * Resolve which category config to use for a given business.
 *
 * Scored, whole-word matching: the category with the MOST keyword hits wins, so
 * a "Thai Massage Spa" (salon: spa+massage = 2) beats restaurant (thai = 1), and
 * a "Barbershop" no longer matches the food keyword "bar". On a tie the
 * first-declared category wins (restaurant → trades → salon → …).
 */
export function resolveCategory(business) {
  const haystack = [
    business.category || '',
    business.name || '',
    business.raw_data?.description || '',
  ]
    .join(' ')
    .toLowerCase()

  let best = { key: 'generic', config: CATEGORY_CONFIG.generic, score: 0 }
  for (const [key, config] of Object.entries(CATEGORY_CONFIG)) {
    if (key === 'generic') continue
    const score = countCategoryMatches(haystack, config.match)
    if (score > best.score) best = { key, config, score }
  }

  return { key: best.key, config: best.config }
}
