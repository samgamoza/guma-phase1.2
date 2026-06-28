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
      // service businesses that the bare word "shop" was wrongly pulling into retail
      'auto', 'auto electrical', 'electrical', 'electrical repair', 'auto repair shop',
      'repair shop', 'service center', 'car repair', 'vulcanizing', 'battery shop',
      'motor', 'motorcycle', 'engine', 'car wash', 'carwash', 'detailing',
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

  catering: {
    label: 'Catering / Events',
    match: [
      'catering', 'caterer', 'events', 'banquet', 'reception', 'pakain', 'boodle',
      'fiesta', 'corporate events', 'birthday catering', 'lechon catering',
      'party catering', 'food catering', 'event catering', 'kasal', 'wedding catering',
    ],
    theme: {
      primary: '#5D4037',
      secondary: '#8D6E63',
      accent: '#FFA000',
      bg: '#FFF8F0',
      text: '#3E2723',
    },
    tone: 'warm, festive, generous. Focus on memorable events, abundance, and joyful gatherings.',
    sections: ['hero', 'packages', 'menu_highlights', 'gallery_placeholder', 'contact'],
    cta: 'Get a Quote',
    cta_secondary: 'View Packages',
    trust_signals: ['years in business', 'events served', 'cuisine specialties', 'delivery area'],
    icon: '🍱',
  },

  laundry: {
    label: 'Laundry Services',
    match: [
      'laundry', 'laundromat', 'dry cleaning', 'labada', 'pressing', 'steam',
      'wash and fold', 'laundry shop', 'laundry service', 'laundry pickup',
      'express laundry', 'coin laundry', 'commercial laundry',
    ],
    theme: {
      primary: '#0277BD',
      secondary: '#29B6F6',
      accent: '#B2EBF2',
      bg: '#F0F9FF',
      text: '#01579B',
    },
    tone: 'clean, efficient, reliable. Focus on freshness, convenience, and fast turnaround.',
    sections: ['hero', 'services', 'pricing', 'hours_location', 'contact'],
    cta: 'Drop Off Today',
    cta_secondary: 'See Rates',
    trust_signals: ['same-day service', 'pickup & delivery', 'years in operation', 'rating'],
    icon: '👕',
  },

  bakeshop: {
    label: 'Bakeshop / Panaderya',
    match: [
      'bakeshop', 'panaderya', 'panaderia', 'bread shop', 'bibingka', 'ensaymada',
      'puto', 'biko', 'kakanin', 'pan de sal', 'pandesal', 'pastry shop', 'cake shop',
      'baked goods', 'bakery shop', 'pasteleria',
    ],
    theme: {
      primary: '#E65100',
      secondary: '#FF6D00',
      accent: '#FFE0B2',
      bg: '#FFFAF5',
      text: '#3E2723',
    },
    tone: 'warm, homey, comforting. Focus on freshness, tradition, and Filipino baking culture.',
    sections: ['hero', 'products', 'specialty_items', 'hours_location', 'contact'],
    cta: 'Order Now',
    cta_secondary: 'See Products',
    trust_signals: ['baked fresh daily', 'no preservatives', 'custom orders', 'delivery'],
    icon: '🍞',
  },

  gym: {
    label: 'Gym / Fitness Center',
    match: [
      'gym', 'fitness center', 'fitness club', 'workout', 'crossfit', 'bodybuilding',
      'yoga studio', 'pilates', 'boxing gym', 'muay thai', 'personal training',
      'weightlifting', 'health club', 'sports center', 'mma', 'jiu jitsu',
      'dance studio', 'zumba', 'functional fitness',
    ],
    theme: {
      primary: '#B71C1C',
      secondary: '#E53935',
      accent: '#FF8A65',
      bg: '#1A1A1A',
      text: '#FFFFFF',
    },
    tone: 'energetic, motivating, powerful. Focus on transformation, community, and results.',
    sections: ['hero', 'memberships', 'classes', 'trainers_placeholder', 'contact'],
    cta: 'Free Trial',
    cta_secondary: 'View Membership',
    trust_signals: ['certified trainers', 'modern equipment', 'community', 'open 7 days'],
    icon: '💪',
  },

  photography: {
    label: 'Photography / Studio',
    match: [
      'photography', 'photographer', 'photo studio', 'portrait studio', 'prenuptial',
      'prenup', 'pictorial', 'maternity shoot', 'events photographer', 'wedding photographer',
      'photo booth', 'studio rental', 'commercial photography', 'product photography',
      'photo editing', 'videographer', 'videography',
    ],
    theme: {
      primary: '#1A1A2E',
      secondary: '#16213E',
      accent: '#E94560',
      bg: '#0F3460',
      text: '#EAEAEA',
    },
    tone: 'artistic, emotional, professional. Focus on storytelling, moments, and visual artistry.',
    sections: ['hero', 'services', 'portfolio_placeholder', 'booking_info', 'contact'],
    cta: 'Book a Session',
    cta_secondary: 'View Portfolio',
    trust_signals: ['professional gear', 'fast delivery', 'portfolio', 'years of experience'],
    icon: '📸',
  },

  petcare: {
    label: 'Pet Care / Veterinary',
    match: [
      'pet', 'veterinary', 'veterinarian', 'vet clinic', 'animal clinic', 'pet grooming',
      'petshop', 'pet shop', 'animal hospital', 'dog grooming', 'cat grooming',
      'pet boarding', 'vet', 'animal care', 'dog training', 'pet hotel',
    ],
    theme: {
      primary: '#E65100',
      secondary: '#00897B',
      accent: '#FFB74D',
      bg: '#FFF9F5',
      text: '#2C1A0E',
    },
    tone: 'warm, caring, trustworthy. Focus on pet welfare, gentle handling, and owner peace of mind.',
    sections: ['hero', 'services', 'vets_placeholder', 'hours_location', 'contact'],
    cta: 'Book Appointment',
    cta_secondary: 'Our Services',
    trust_signals: ['licensed vet', 'gentle handling', 'walk-ins welcome', 'rating'],
    icon: '🐾',
  },

  gadgetrepair: {
    label: 'Phone / Gadget Repair',
    match: [
      'phone repair', 'cellphone repair', 'gadget repair', 'iphone repair', 'samsung repair',
      'tablet repair', 'laptop repair', 'cellphone shop', 'phone accessories', 'computer repair',
      'screen repair', 'battery replacement', 'tech repair', 'gadget shop',
    ],
    theme: {
      primary: '#0D47A1',
      secondary: '#1565C0',
      accent: '#29B6F6',
      bg: '#0A0A1A',
      text: '#E0E0E0',
    },
    tone: 'technical, efficient, trustworthy. Focus on fast repair, warranty, and genuine parts.',
    sections: ['hero', 'services', 'pricing', 'hours_location', 'contact'],
    cta: 'Get Repair Quote',
    cta_secondary: 'Walk-In Welcome',
    trust_signals: ['90-day warranty', 'genuine parts', 'same-day repair', 'rating'],
    icon: '📱',
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
