/**
 * Template Engine — ZERO COST site generation.
 *
 * Loads a pre-built HTML template, substitutes {{PLACEHOLDERS}} with real
 * business data, and returns finished HTML. No AI API calls needed.
 *
 * Template priority:
 *   1. src/templates/html/{categoryKey}.html  — exact category match
 *   2. src/templates/html/generic.html         — fallback (uses retail template)
 *
 * Claude API is NOT used here. Reserve it for Phase 5 paid upgrades only.
 */

import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveImages } from './images.js'
import { CATEGORY_CONFIG } from '../templates/categories.js'
import { logger } from '../utils/logger.js'

const __dirname  = dirname(fileURLToPath(import.meta.url))
const TMPL_DIR   = join(__dirname, '../templates/html')
const SITE_BASE  = process.env.SITE_BASE_URL || 'https://guma.ai'

// Which template file to use per category key
const TEMPLATE_MAP = {
  restaurant: 'restaurant',
  salon:      'salon',
  trades:     'trades',
  medical:    'medical',
  legal:      'legal',
  retail:     'retail',
  generic:    'retail',   // retail is the most neutral fallback
}

// NOTE: CSS-injected layout variants were reverted — they added fragility
// (oversized long names, etc.) for marginal benefit. {{LAYOUT_CSS}} now renders
// empty; per-business variety comes from the 8-palette axis. Real layout
// flexibility will come from an LLM-authored renderer, not CSS overrides.

/**
 * Generate a complete website for a business using pre-built templates.
 * Returns the same shape as SiteGenerator.generate() for drop-in compatibility.
 */
function calculateLeadScore(business) {
  let score = 0;
  const rd = business.raw_data || {};
  const reviews = parseInt(rd.review_count || 0);
  if (reviews >= 200) score += 40;
  else if (reviews >= 100) score += 30;
  else if (reviews >= 20) score += 15;

  const rating = parseFloat(rd.rating || 0);
  if (rating >= 4.5) score += 20;
  else if (rating >= 4.0) score += 10;

  if (business.email) score += 20;
  if (business.phone) score += 10;

  const hasSocial = rd.social_links && Object.keys(rd.social_links).length > 0;
  const hasServices = rd.services && rd.services.length > 0;
  if (hasSocial) score += 5;
  if (hasServices) score += 5;

  return Math.min(100, score);
}

/**
 * Generate a complete website for a business using pre-built templates.
 * Returns the same shape as SiteGenerator.generate() for drop-in compatibility.
 *
 * @param {object} business      — DB row from businesses table
 * @param {string} categoryKey   — resolved category key
 * @param {object} categoryConfig — category config from categories.js
 * @param {object|null} spec     — content_spec from contentAgent (Haiku-generated).
 *   When provided, all content fields (tagline, offerings, trust points, image
 *   queries) are drawn from the spec rather than hardcoded fallbacks. The spec
 *   is stored in the DB and reused on every future re-render — Haiku is called
 *   only once per business.
 */
export async function generateFromTemplate(business, categoryKey, categoryConfig, spec = null) {
  // ── Upgrade a vague "generic" classification using Haiku's understanding ──
  // The keyword resolver can miss a business type (e.g. "Mei Sum Tea House"),
  // but Haiku reliably infers offering_type. Trust it to pick the real template
  // so food businesses stop getting the retail "Shop" layout.
  let effectiveKey    = categoryKey
  let effectiveConfig = categoryConfig
  if (categoryKey === 'generic' && spec?.offering_type) {
    if (spec.offering_type === 'menu')          effectiveKey = 'restaurant'
    else if (spec.offering_type === 'products') effectiveKey = 'retail'
    // "services" / "mixed" stay generic
    if (effectiveKey !== categoryKey) {
      effectiveConfig = CATEGORY_CONFIG[effectiveKey] || categoryConfig
      logger.info(`[TemplateEngine] "${business.name}" reclassified generic → ${effectiveKey} (offering_type=${spec.offering_type})`)
    }
  }

  categoryKey    = effectiveKey
  categoryConfig = effectiveConfig
  const tmplKey  = TEMPLATE_MAP[categoryKey] || 'retail'

  // Always use the hero-first layout — keeps hero at top where visitors expect it
  const variantPath = join(TMPL_DIR, `${tmplKey}-hero.html`)
  const corePath = join(TMPL_DIR, `${tmplKey}.html`)

  let tmplPath = corePath
  let layoutName = 'core'
  if (existsSync(variantPath)) {
    tmplPath = variantPath
    layoutName = `${tmplKey}-hero`
  } else if (!existsSync(corePath)) {
    throw new Error(`Template not found: ${tmplKey}`)
  }

  const raw        = readFileSync(tmplPath, 'utf8')
  const specQueries = spec
    ? { hero: spec.hero_image_query, gallery: spec.gallery_queries }
    : null
  const images = await resolveImages(categoryKey, business, specQueries)

  const slug     = business.slug
  const claimUrl = `${SITE_BASE}/claim/${slug}`
  const siteUrl  = `${SITE_BASE}/sites/${slug}`

  // Build substitution map
  const leadScore = calculateLeadScore(business)
  const styleTier = leadScore >= 80 ? 'premium' : 'standard'
  
  const vars = buildVars({ business, categoryKey, categoryConfig, images, claimUrl, siteUrl, leadScore, styleTier, spec })

  // Replace all {{PLACEHOLDER}} tokens
  const html = raw.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => {
    const val = vars[key]
    if (val === undefined) {
      logger.debug(`Template var not found: {{${key}}} in ${layoutName}`)
      return ''
    }
    return val
  })

  logger.info(`[TemplateEngine] Generated "${business.name}" using ${layoutName} layout (zero cost)`)

  return {
    businessId:    business.id,
    slug,
    html,
    categoryKey,
    theme:         categoryConfig.theme,
    sections:      categoryConfig.sections,
    tokenEstimate: 0,   // no tokens used
    source:        'template',
  }
}

// ─── Build the variables map ──────────────────────────────────────────────────

function buildVars({ business, categoryKey, categoryConfig, images, claimUrl, siteUrl, leadScore, styleTier, spec }) {
  const raw     = business.raw_data || {}
  const name    = business.name    || 'Local Business'
  const city    = business.city    || ''
  const phone   = business.phone   || ''
  const address = business.address || city
  const country = business.country || 'US'
  const year    = new Date().getFullYear().toString()

  // Rating / reviews
  const rating      = raw.rating       || '5.0'
  const reviewCount = raw.review_count || raw.reviewCount || '10'

  // Hours — use raw or sensible default
  const hours = raw.hours || 'Mon–Fri: 9am–5pm · Sat: 10am–3pm · Sun: Closed'

  // Category label
  const categoryLabel = business.category || categoryConfig.label || 'Local Business'

  // ── Content: use spec (Haiku-generated) when available, fall back to hardcoded ──

  const tagline = spec?.tagline || buildTagline(name, categoryKey, city)

  const description = spec?.about_text
    || raw.description
    || `${name} is a trusted ${categoryLabel.toLowerCase()} serving ${city || 'the local community'}.`

  const heroSubtext = spec?.hero_subtext || description

  // ── List-token formatting ──
  // The restaurant template injects these tokens straight into HTML <ul> blocks,
  // so it needs <li>…</li> items. Every OTHER template injects them into a quoted
  // JS string and parses with .split('|'), so those need pipe-delimited plain text
  // that is safe inside a string literal (no raw quotes/newlines). One format per
  // category — the categoryKey picks the template, so it also picks the format.
  const isRestaurant = categoryKey === 'restaurant'

  // Format a plain string[] for the active template context.
  const fmtList = (arr) => isRestaurant
    ? arr.map((s) => `<li>${esc(s)}</li>`).join('\n')
    : arr.map(jsSafe).filter(Boolean).join('|')

  // Format spec offerings (name + optional desc): rich <li> for restaurant HTML,
  // clean plain names for the JS templates (which add their own desc/price).
  const fmtOfferings = (offs) => isRestaurant
    ? offs.map((o) => `<li><strong>${esc(o.name)}</strong>${o.desc ? ` — ${esc(o.desc)}` : ''}</li>`).join('\n')
    : offs.map((o) => jsSafe(o.name)).filter(Boolean).join('|')

  // Offerings — real business data from spec, or hardcoded category defaults
  const services    = spec?.offerings?.length
    ? fmtOfferings(spec.offerings)
    : fmtList(buildServices(categoryKey, categoryLabel))

  const menuItems   = spec?.offerings?.length
    ? fmtOfferings(spec.offerings)
    : fmtList(buildMenuItems(categoryKey))

  const signatureItems = services
  const dishes         = menuItems

  // Offering section label — adapts to business type
  const offeringsLabel = spec?.offering_type === 'products' ? 'Our Products'
    : spec?.offering_type === 'menu'           ? 'Our Menu'
    : spec?.offering_type === 'mixed'          ? 'What We Offer'
    : 'Our Services'

  // Trust points — specific to this business from spec
  const trustPoints = spec?.trust_points?.length
    ? fmtList(spec.trust_points)
    : fmtList(buildTrustPoints(categoryKey, city, rating))

  const teamMembers = fmtList(buildTeamMembers(name))
  const serviceArea = fmtList(buildServiceArea(city))
  const socialProof = (parseInt(reviewCount) > 0 ? reviewCount : '50') + '+ happy customers'

  // CTA overrides from spec
  const primaryCta   = spec?.cta_primary   || categoryConfig.cta            || 'Get in Touch'
  const secondaryCta = spec?.cta_secondary || categoryConfig.cta_secondary  || 'Learn More'

  // Filipino localisation tokens (used in some templates)
  const filTagline = buildFilTagline(categoryKey)
  const filCta     = primaryCta

  // Style Tier Overrides — used to inject tier-specific CSS into the <head>
  const tierConfig = categoryConfig.styleTiers?.[styleTier] || {}
  const hasAnimation = tierConfig.animation && tierConfig.animation !== 'none'

  const tierStyles = `
    :root {
      --border-radius: ${tierConfig.radius || '8px'};
      --glass-opacity: ${tierConfig.glassmorphism ? '0.75' : '1.0'};
      --reveal-anim: ${tierConfig.animation || 'none'};
    }
    ${hasAnimation ? `
      .animate-reveal {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        will-change: opacity, transform;
      }
      .animate-reveal.visible {
        opacity: 1;
        transform: translateY(0);
      }
    ` : ''}
  `

  const revealJs = hasAnimation ? `
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.15 });
        document.querySelectorAll('.animate-reveal').forEach(el => observer.observe(el));
      });
    </script>
  ` : ''

  // Gallery images — Unsplash from resolveImages
  const galleries = images.galleryUrls || images.gallery || []
  const gallery   = (i) => galleries[i] || images.heroUrl || ''

  // Hide the gallery section entirely when no images are available
  const galleryImages = [0, 1, 2, 3, 4, 5].map(gallery)
  const hasGalleryImages = galleryImages.some(url => url && url.trim().length > 0)

  // Axis 1 — Color palettes: 8 distinct schemes, deterministically chosen per slug
  const PALETTES = [
    { primary: '#1A5276', secondary: '#2E86C1', accent: '#F39C12', accentLight: '#F7DC6F', dark: '#0D1B2A', dark2: '#1a2a3a' }, // Indigo/Amber
    { primary: '#7B241C', secondary: '#C0392B', accent: '#F0B27A', accentLight: '#FDEBD0', dark: '#1C0A08', dark2: '#2C1008' }, // Crimson/Warm
    { primary: '#1A7A4A', secondary: '#239B56', accent: '#F4D03F', accentLight: '#FEFCE1', dark: '#0A2E1A', dark2: '#0F3D22' }, // Forest/Gold
    { primary: '#145A7C', secondary: '#1F8FB8', accent: '#48C9B0', accentLight: '#D1F5EF', dark: '#082030', dark2: '#0D3040' }, // Teal/Navy
    { primary: '#6C3483', secondary: '#9B59B6', accent: '#E74C3C', accentLight: '#FADBD8', dark: '#2C1250', dark2: '#3D1A6E' }, // Purple/Rose
    { primary: '#935116', secondary: '#CA6F1E', accent: '#2471A3', accentLight: '#D6EAF8', dark: '#3A1F05', dark2: '#4E2A07' }, // Amber/Steel
    { primary: '#1C2833', secondary: '#2C3E50', accent: '#E74C3C', accentLight: '#FADBD8', dark: '#0A0F14', dark2: '#141D26' }, // Charcoal/Red
    { primary: '#0E6655', secondary: '#1ABC9C', accent: '#F39C12', accentLight: '#FEF9E7', dark: '#04261F', dark2: '#073B2E' }, // Emerald/Gold
  ]
  const seed = (business.slug || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const palette = PALETTES[seed % PALETTES.length]
  const PALETTE_CSS = `<style>:root{--color-primary:${palette.primary};--color-secondary:${palette.secondary};--color-accent:${palette.accent};--color-accent-light:${palette.accentLight};--color-dark:${palette.dark};--color-dark-2:${palette.dark2};}
/* Reveal-safety: templates start scroll-reveal content at opacity:0 and depend on
   a script to fade it in. If that script's selector doesn't match (it targets
   .animate-reveal but the markup uses .fade-up), the content stays invisible —
   empty sections. Force every reveal class visible. Content > animation. */
.fade-up,.fade-in,.reveal,.reveal-up,.scroll-reveal,.animate-reveal,[data-reveal]{opacity:1!important;transform:none!important;visibility:visible!important}</style>`

  // Decorative ambiance video band (people-free motion). Self-contained inline
  // styles; the real business photo is the poster so it shows instantly. Empty
  // string when no video resolved → the band simply doesn't render.
  const AMBIANCE_BLOCK = images.videoUrl ? `
<section style="position:relative;height:clamp(320px,55vh,560px);overflow:hidden;background:#111;">
  <video autoplay muted loop playsinline preload="metadata" poster="${images.heroUrl || ''}"
         style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">
    <source src="${images.videoUrl}" type="video/mp4">
  </video>
  <div style="position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,.30),rgba(0,0,0,.60));"></div>
  <div style="position:relative;z-index:2;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem;color:#fff;">
    <div style="font-family:Georgia,serif;font-size:clamp(1.7rem,4.2vw,3rem);font-weight:700;max-width:20ch;line-height:1.15;letter-spacing:-.02em;text-shadow:0 2px 20px rgba(0,0,0,.4);">${esc(tagline)}</div>
    <a href="${claimUrl}" style="margin-top:1.5rem;display:inline-block;background:var(--color-accent,#fff);color:#111;padding:.8rem 2rem;border-radius:999px;font-weight:600;text-decoration:none;font-size:.95rem;">${esc(primaryCta)}</a>
  </div>
</section>` : ''

  return {
    BUSINESS_NAME:      name,
    TAGLINE:            tagline,
    DESCRIPTION:        description,
    HERO_SUBTEXT:       heroSubtext,
    ABOUT_TEXT:         description,
    PHONE:              phone || 'Call us for details',
    ADDRESS:            address,
    CITY:               city,
    COUNTRY:            country,
    CATEGORY:           categoryLabel,
    CUISINE_TYPE:       categoryLabel,
    OFFERINGS_LABEL:    offeringsLabel,
    HOURS:              hours,
    RATING:             rating,
    REVIEW_COUNT:       reviewCount,
    YEAR:               year,
    HERO_IMAGE:         images.heroUrl || '',
    GALLERY_1:          gallery(0),
    GALLERY_2:          gallery(1),
    GALLERY_3:          gallery(2),
    GALLERY_4:          gallery(3),
    GALLERY_5:          gallery(4),
    GALLERY_6:          gallery(5),
    CLAIM_URL:          claimUrl,
    SITE_URL:           siteUrl,
    SERVICES:           services,
    MENU_ITEMS:         menuItems,
    TRUST_POINTS:       trustPoints,
    SIGNATURE_ITEMS:    signatureItems,
    DISHES:             dishes,
    TEAM_MEMBERS:       teamMembers,
    SERVICE_AREA_CITIES: serviceArea,
    SOCIAL_PROOF_COUNT: socialProof,
    LANG_TOGGLE:        '',
    FIL_TAGLINE:        filTagline,
    FIL_CTA:            filCta,
    STYLE_TIER_CSS:     tierStyles,
    TIER_BADGE:         styleTier === 'premium' ? '<div class="premium-badge">Featured Partner</div>' : '',
    REVEAL_JS:          revealJs,
    SLUG:               business.slug,
    PRIMARY_CTA:        primaryCta,
    SECONDARY_CTA:      secondaryCta,
    ICON:               categoryConfig.icon || '🏢',
    GALLERY_SECTION_STYLE: hasGalleryImages ? '' : 'display:none',
    PALETTE_CSS,
    LAYOUT_CSS:         '',   // layout variants reverted — see note above
    AMBIANCE_BLOCK,
  }
}

// ─── Content builders ─────────────────────────────────────────────────────────

function buildTagline(name, categoryKey, city) {
  const map = {
    restaurant: `Great food, great vibes${city ? ` in ${city}` : ''}`,
    salon:      `Look & feel your best${city ? ` in ${city}` : ''}`,
    trades:     `Reliable service${city ? ` across ${city}` : ''} — done right`,
    medical:    `Your health is our priority`,
    legal:      `Experienced legal counsel you can trust`,
    retail:     `Your local favourite${city ? ` in ${city}` : ''}`,
    generic:    `Serving ${city || 'the community'} with pride`,
  }
  return map[categoryKey] || map.generic
}

function buildServices(categoryKey, label) {
  const map = {
    restaurant: ['Dine In', 'Takeaway', 'Catering', 'Private Events'],
    salon:      ['Haircut & Styling', 'Colour & Highlights', 'Manicure & Pedicure', 'Facials & Skincare'],
    trades:     ['Free Quotes', 'Emergency Callouts', 'Repairs & Maintenance', 'New Installations'],
    medical:    ['General Consultations', 'Preventive Care', 'Specialist Referrals', 'Telehealth'],
    legal:      ['Free Consultation', 'Contract Review', 'Dispute Resolution', 'Legal Advice'],
    retail:     ['In-Store Shopping', 'Online Orders', 'Gift Wrapping', 'Loyalty Rewards'],
    generic:    ['Professional Services', 'Consultations', 'Custom Solutions', 'Local Delivery'],
  }
  return map[categoryKey] || map.generic
}

function buildMenuItems(categoryKey) {
  const map = {
    restaurant: ['Signature Dish', 'Chef\'s Special', 'Daily Special', 'Desserts'],
    salon:      ['Cut & Style', 'Full Colour', 'Blowout', 'Treatment'],
    trades:     ['Standard Service', 'Emergency Call', 'Maintenance Plan', 'Full Install'],
    medical:    ['Initial Consultation', 'Follow-up Visit', 'Health Screening', 'Specialist Review'],
    legal:      ['Initial Consultation', 'Document Review', 'Full Representation', 'Ongoing Retainer'],
    retail:     ['New Arrivals', 'Best Sellers', 'Sale Items', 'Gift Ideas'],
    generic:    ['Service A', 'Service B', 'Package Deal', 'Premium Option'],
  }
  return map[categoryKey] || map.generic
}

function buildTrustPoints(categoryKey, city, rating) {
  const map = {
    restaurant: [`${rating}★ rated`, `Locally owned`, `Fresh ingredients daily`, `Family friendly`],
    salon:      [`${rating}★ rated`, `Certified stylists`, `Premium products`, `Walk-ins welcome`],
    trades:     [`Licensed & insured`, `${city || 'Local'} based`, `Free quotes`, `Same-day service`],
    medical:    [`Accepting new patients`, `All insurances`, `Same-day appointments`, `Caring staff`],
    legal:      [`Free consultation`, `No win no fee`, `Confidential`, `Experienced team`],
    retail:     [`${rating}★ rated`, `Locally owned`, `Easy returns`, `Loyalty rewards`],
    generic:    [`${rating}★ rated`, `Locally owned`, `Trusted service`, `${city || 'Local'} based`],
  }
  return map[categoryKey] || map.generic
}

function buildSignatureItems(categoryKey, label) {
  return buildServices(categoryKey, label)
}

function buildDishes(categoryKey) {
  return buildMenuItems(categoryKey)
}

function buildTeamMembers(businessName) {
  return [`Our friendly team at ${businessName}`]
}

function buildServiceArea(city) {
  if (!city) return ['Local area']
  return [city, 'Surrounding suburbs', 'Greater metro area']
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Make a value safe to embed inside a quoted JS string literal AND inside a
 * pipe-delimited list. Strips quotes, backslashes, the pipe delimiter, angle
 * brackets, and any newline/tab — a single un-escaped " or newline here was
 * throwing a SyntaxError that killed the whole inline <script> (empty sections,
 * un-rendered services/team grids) on every non-restaurant template.
 */
function jsSafe(str) {
  return String(str ?? '')
    .replace(/[\\"'`\r\n\t|<>]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildFilTagline(categoryKey) {
  const map = {
    restaurant: 'Masarap na pagkain para sa lahat',
    salon:      'Maganda ka sa amin',
    trades:     'Maaasahang serbisyo',
    medical:    'Ang iyong kalusugan ang aming priyoridad',
    legal:      'Ligal na tulong na mapagkakatiwalaan',
    retail:     'Ang iyong paboritong tindahan',
    generic:    'Naglilingkod sa komunidad',
  }
  return map[categoryKey] || ''
}
