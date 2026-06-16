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
 */
export async function generateFromTemplate(business, categoryKey, categoryConfig) {
  const tmplKey  = TEMPLATE_MAP[categoryKey] || 'retail'

  // Pick a random variant layout (if available)
  const variants = ['hero', 'content']
  const variant = variants[Math.floor(Math.random() * variants.length)]
  const variantPath = join(TMPL_DIR, `${tmplKey}-${variant}.html`)
  const corePath = join(TMPL_DIR, `${tmplKey}.html`)

  let tmplPath = corePath
  let layoutName = 'core'
  if (existsSync(variantPath)) {
    tmplPath = variantPath
    layoutName = `${tmplKey}-${variant}`
  } else if (!existsSync(corePath)) {
    throw new Error(`Template not found: ${tmplKey}`)
  }

  const raw    = readFileSync(tmplPath, 'utf8')
  const images = await resolveImages(categoryKey, business)

  const slug     = business.slug
  const claimUrl = `${SITE_BASE}/claim/${slug}`
  const siteUrl  = `${SITE_BASE}/sites/${slug}`

  // Build substitution map
  const leadScore = calculateLeadScore(business)
  const styleTier = leadScore >= 80 ? 'premium' : 'standard'
  
  const vars = buildVars({ business, categoryKey, categoryConfig, images, claimUrl, siteUrl, leadScore, styleTier })

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

function buildVars({ business, categoryKey, categoryConfig, images, claimUrl, siteUrl, leadScore, styleTier }) {
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

  // Tagline — crafted from category tone
  const tagline = buildTagline(name, categoryKey, city)

  // Description
  const description = raw.description
    || `${name} is a trusted ${categoryLabel.toLowerCase()} serving ${city || 'the local community'}.`

  // Services list — category-specific defaults
  const services    = buildServices(categoryKey, categoryLabel)
  const menuItems   = buildMenuItems(categoryKey)
  const trustPoints = buildTrustPoints(categoryKey, city, rating)
  const signatureItems = buildSignatureItems(categoryKey, categoryLabel)
  const dishes      = buildDishes(categoryKey)
  const teamMembers = buildTeamMembers(name)
  const serviceArea = buildServiceArea(city)
  const socialProof = (parseInt(reviewCount) > 0 ? reviewCount : '50') + '+ happy customers'

  // Filipino localisation tokens (used in some templates)
  const filTagline = buildFilTagline(categoryKey)
  const filCta     = categoryConfig.cta || 'Get in Touch'

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

  return {
    BUSINESS_NAME:      name,
    TAGLINE:            tagline,
    DESCRIPTION:        description,
    PHONE:              phone || 'Call us for details',
    ADDRESS:            address,
    CITY:               city,
    COUNTRY:            country,
    CATEGORY:           categoryLabel,
    CUISINE_TYPE:       categoryLabel,
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
    LANG_TOGGLE:        '',   // future: language switcher
    FIL_TAGLINE:        filTagline,
    FIL_CTA:            filCta,
    STYLE_TIER_CSS:     tierStyles,
    TIER_BADGE:         styleTier === 'premium' ? '<div class="premium-badge">Featured Partner</div>' : '',
    REVEAL_JS:          revealJs,
    SLUG:               business.slug,
    PRIMARY_CTA:        categoryConfig.cta,
    SECONDARY_CTA:      categoryConfig.cta_secondary || '',
    ICON:               categoryConfig.icon || '🏢',
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
  const items = map[categoryKey] || map.generic
  return items.map((s) => `<li>${s}</li>`).join('\n')
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
  const items = map[categoryKey] || map.generic
  return items.map((m) => `<li>${m}</li>`).join('\n')
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
  const items = map[categoryKey] || map.generic
  return items.map((t) => `<li>${t}</li>`).join('\n')
}

function buildSignatureItems(categoryKey, label) {
  return buildServices(categoryKey, label)
}

function buildDishes(categoryKey) {
  return buildMenuItems(categoryKey)
}

function buildTeamMembers(businessName) {
  return `<li>Our friendly team at ${businessName}</li>`
}

function buildServiceArea(city) {
  if (!city) return '<li>Local area</li>'
  return `<li>${city}</li><li>Surrounding suburbs</li><li>Greater metro area</li>`
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
