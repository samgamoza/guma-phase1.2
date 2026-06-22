/**
 * dnaAdapter — injects BusinessDNA into the Generator.
 *
 * The current generation path (templateEngine + buildVars) consumes a
 * `content_spec` object. This adapter maps the strategic BusinessDNA blueprint
 * onto that shape so the Generator renders from the agent's strategy:
 *   hero_variants      → tagline / hero_subtext
 *   content_strategy   → about_text / offerings / trust_points
 *   uiux_strategy      → hero_image_query / gallery_queries
 *   competitive_positioning → personality (palette/style)
 *   seo_strategy       → meta (carried for templates that render it)
 *
 * The full DNA is also persisted separately (businesses.business_dna) for the
 * future Planner / Architect / Designer / Content Writer sub-agents.
 */

// Which hero best fits the brand — premium for upscale, emotional for
// experience-led, direct_response otherwise.
function pickHero(dna) {
  const heroes = dna.hero_variants || {}
  const pricing = (dna.competitive_positioning?.pricing_position || '').toLowerCase()
  const personality = (dna.competitive_positioning?.brand_personality || '').toLowerCase()

  if (['premium', 'luxury'].includes(pricing) || personality === 'luxury') {
    if (heroes.premium?.headline) return heroes.premium
  }
  if (['playful', 'friendly'].includes(personality)) {
    if (heroes.emotional?.headline) return heroes.emotional
  }
  return heroes.direct_response || heroes.premium || heroes.emotional || {}
}

// Normalise the agent's brand_personality to the template engine's enum.
function mapPersonality(p) {
  const v = (p || '').toLowerCase()
  if (v === 'playful') return 'friendly'
  if (['professional', 'friendly', 'luxury', 'clinical', 'authoritative'].includes(v)) return v
  return 'professional'
}

function ctaForOffering(offeringType) {
  switch ((offeringType || '').toLowerCase()) {
    case 'menu':     return 'Order Now'
    case 'products': return 'Shop Now'
    case 'services': return 'Book Now'
    case 'mixed':    return 'Get Started'
    default:         return 'Get in Touch'
  }
}

/**
 * businessDnaToSpec — produce a content_spec the Generator can render.
 * Defensive against partial DNA: every field has a sensible fallback.
 */
export function businessDnaToSpec(dna, business) {
  const hero    = pickHero(dna)
  const offering = dna.offering_analysis || {}
  const content = dna.content_strategy || {}
  const uiux    = dna.uiux_strategy || {}
  const seo     = dna.seo_strategy || {}
  const city    = business.city || ''
  const name    = business.name || 'Local Business'

  const offerings = Array.isArray(offering.offerings) && offering.offerings.length
    ? offering.offerings.slice(0, 6)
    : []

  // Dedup: the hero subtext must NOT repeat the tagline. Prefer the descriptive
  // about_text; fall back to the hero subheadline only if it differs.
  const tagline = hero.headline || `${name}${city ? ` — ${city}` : ''}`
  const norm = (s) => (s || '').trim().toLowerCase()
  let heroSubtext = content.about_text || ''
  if (!heroSubtext && norm(hero.subheadline) !== norm(tagline)) heroSubtext = hero.subheadline || ''

  return {
    // ── fields the templateEngine already reads ──────────────────────────────
    tagline,
    hero_subtext:  heroSubtext,
    about_text:    content.about_text || dna.competitive_positioning?.market_position || '',
    offering_type: offering.offering_type || 'services',
    offerings,
    trust_points:  Array.isArray(content.trust_points) ? content.trust_points.slice(0, 4) : [],
    cta_primary:   ctaForOffering(offering.offering_type),
    cta_secondary: 'Learn More',
    hero_image_query: uiux.hero_image_query
      || `${dna.classification?.niche || business.category || 'local business'} interior professional`,
    gallery_queries: Array.isArray(uiux.gallery_queries) && uiux.gallery_queries.length
      ? uiux.gallery_queries.slice(0, 3)
      : null,
    personality:   mapPersonality(dna.competitive_positioning?.brand_personality),

    // ── layout-variant hints (drive Axis 3 in the template engine) ───────────
    layout_style:       uiux.layout_style || null,
    design_personality: uiux.design_personality || dna.competitive_positioning?.brand_personality || null,

    // ── strategic extras (used where templates support them; harmless if not) ─
    meta_title:        seo.meta_title || null,
    meta_description:  seo.meta_description || null,

    // ── provenance ────────────────────────────────────────────────────────────
    source: 'business_dna',
    generated_at: new Date().toISOString(),
    _dna_niche: dna.classification?.niche || null,
  }
}
