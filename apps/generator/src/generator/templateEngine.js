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
  restaurant:   'restaurant',
  salon:        'salon',
  trades:       'trades',
  medical:      'medical',
  legal:        'legal',
  retail:       'retail',
  catering:     'catering',
  laundry:      'laundry',
  bakeshop:     'bakeshop',
  gym:          'gym',
  photography:  'photography',
  petcare:      'petcare',
  gadgetrepair: 'gadgetrepair',
  generic:      'generic',
}

// NOTE: CSS-injected layout variants were reverted — they added fragility
// (oversized long names, etc.) for marginal benefit. {{LAYOUT_CSS}} now renders
// empty; per-business variety comes from the 8-palette axis. Real layout
// flexibility will come from an LLM-authored renderer, not CSS overrides.

/**
 * Generate a complete website for a business using pre-built templates.
 * Returns the same shape as SiteGenerator.generate() for drop-in compatibility.
 */
export function calculateLeadScore(business) {
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
  // BI's offering_type is far more reliable than keyword matching for the
  // product-vs-service template family. Keyword matching turns "Auto Electrical
  // Repair Shop" into RETAIL (because of "shop") and renders a store with fake
  // products + prices. Trust offering_type to correct gross mismatches.
  let effectiveKey    = categoryKey
  let effectiveConfig = categoryConfig
  const PRODUCT_TEMPLATES = new Set(['retail'])
  const MENU_TEMPLATES    = new Set(['restaurant', 'bakeshop'])
  if (spec?.offering_type) {
    const ot = spec.offering_type
    if (ot === 'services' && (PRODUCT_TEMPLATES.has(categoryKey) || MENU_TEMPLATES.has(categoryKey))) {
      // A service business mis-filed onto a products/menu template — never sell
      // "₱299 Premium Item 1" for a repair shop. Route to a services template.
      effectiveKey = 'trades'
    } else if (categoryKey === 'generic') {
      if (ot === 'menu')          effectiveKey = 'restaurant'
      else if (ot === 'products') effectiveKey = 'retail'
      // "services" / "mixed" stay generic
    }
    if (effectiveKey !== categoryKey) {
      effectiveConfig = CATEGORY_CONFIG[effectiveKey] || categoryConfig
      logger.info(`[TemplateEngine] "${business.name}" reclassified ${categoryKey} → ${effectiveKey} (offering_type=${ot})`)
    }
  }

  categoryKey    = effectiveKey
  categoryConfig = effectiveConfig
  const tmplKey  = TEMPLATE_MAP[categoryKey] || 'generic'

  // A/B/C variant selection — deterministic per slug (same business always same variant)
  const slugSeed   = (business.slug || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const variantIdx = slugSeed % 3
  const variantSfx = ['', '-b', '-c'][variantIdx]

  // Template cascade. The industry-specific landing page ({cat}-lp) must win over
  // the generic variants — otherwise, since per-category -lp-b/-lp-c don't exist,
  // any slug hashing to variant b/c fell through to generic-lp-b/c and the
  // industry design never rendered (~2/3 of businesses). Order:
  //   {cat}-lp-{b|c}  (category variant, if it ever exists)
  //   {cat}-lp        (industry landing page) ← now ABOVE generic variants
  //   generic-lp-{b|c}(only reached when there is no {cat}-lp, i.e. cat = 'generic')
  //   {cat}-hero → {cat}
  // For 'generic' businesses tmplKey IS 'generic', so generic-lp-{b|c} still wins
  // first there, preserving per-business variety for the uncategorised long tail.
  const candidates = [
    variantSfx ? join(TMPL_DIR, `${tmplKey}-lp${variantSfx}.html`) : null,
    join(TMPL_DIR, `${tmplKey}-lp.html`),
    variantSfx ? join(TMPL_DIR, `generic-lp${variantSfx}.html`)    : null,
    join(TMPL_DIR, `${tmplKey}-hero.html`),
    join(TMPL_DIR, `${tmplKey}.html`),
  ].filter(Boolean)

  let tmplPath   = null
  let layoutName = null
  for (const p of candidates) {
    if (existsSync(p)) {
      tmplPath   = p
      layoutName = p.replace(/.*[\\/]/, '').replace('.html', '')
      break
    }
  }
  if (!tmplPath) throw new Error(`Template not found: ${tmplKey}`)

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

  // Rating / reviews — only surface REAL values; never fabricate social proof.
  // hasRealRating / hasRealReviews gate the hero stat cells (see HERO_STATS).
  const rawRating      = raw.rating
  const rawReviewCount = raw.review_count ?? raw.reviewCount
  const hasRealRating  = rawRating != null && String(rawRating).trim() !== '' && parseFloat(rawRating) > 0
  const reviewNum      = parseInt(rawReviewCount, 10)
  const hasRealReviews = Number.isFinite(reviewNum) && reviewNum > 0
  // Legacy tokens (still consumed by older non-LP templates) keep a benign
  // fallback; LP templates render stats via HERO_STATS, not these directly.
  const rating      = hasRealRating  ? String(rawRating) : '5.0'
  const reviewCount = hasRealReviews ? String(reviewNum) : '10'

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

  // Trust points — specific to this business from spec. The hardcoded fallback
  // seeds a "{rating}★ rated" point; drop any rating-based claim when we have no
  // real rating so a data-less business never fabricates a 5.0★ trust signal.
  const fallbackTrust = buildTrustPoints(categoryKey, city, rating)
    .filter(s => hasRealRating || !/★|rated/i.test(s))
  const trustPoints = spec?.trust_points?.length
    ? fmtList(spec.trust_points)
    : fmtList(fallbackTrust)

  const teamMembers = fmtList(buildTeamMembers(name))
  const serviceArea = fmtList(buildServiceArea(city))

  // Always-HTML tokens for landing page templates (never JS-injected, always safe in <ul> context)
  const servicesHtml = spec?.offerings?.length
    ? spec.offerings.map(o => `<li><strong>${esc(o.name)}</strong>${o.desc ? ` — ${esc(o.desc)}` : ''}</li>`).join('\n')
    : buildServices(categoryKey, categoryLabel).map(s => `<li><strong>${esc(s)}</strong></li>`).join('\n')

  const trustHtml = spec?.trust_points?.length
    ? spec.trust_points.map(s => `<li>${esc(s)}</li>`).join('\n')
    : fallbackTrust.map(s => `<li>${esc(s)}</li>`).join('\n')
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
.fade-up,.fade-in,.reveal,.reveal-up,.scroll-reveal,.animate-reveal,[data-reveal]{opacity:1!important;transform:none!important;visibility:visible!important}
/* Fallback hero-stats styling. Category LP templates define their own (later in
   the cascade, so they win); the Tailwind generic variants rely on this. */
.hero-stats{display:flex;gap:36px;flex-wrap:wrap;margin-top:44px;padding-top:32px;border-top:1px solid rgba(255,255,255,.15)}
.stat-val{font-size:34px;font-weight:700;line-height:1;color:#fff}
.stat-label{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:.6;margin-top:5px;color:#fff}
/* Gallery (real Google/stock photos) — self-contained, palette-aware. */
.guma-gallery{padding:clamp(56px,8vw,88px) clamp(20px,5vw,52px);background:#fff}
.guma-gallery .gg-eyebrow{font-size:10px;letter-spacing:5px;text-transform:uppercase;color:var(--color-primary,#2C3E50);margin-bottom:10px;font-weight:600}
.guma-gallery .gg-title{font-family:Georgia,'DM Serif Display',serif;font-size:clamp(28px,4vw,48px);color:#1a1a2e;margin:0 0 40px;line-height:1.05}
.guma-gallery .gg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.guma-gallery .gg-grid img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;display:block;background:var(--color-dark-2,#141D26)}</style>`

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

  // ── Hero stats — honest only. Show rating/reviews ONLY when real data exists
  // (no more fabricated "5.0★ · 10+ reviews"), plus a truthful location anchor.
  // Replaces the old always-on "Est. {YEAR}" cell (which misleadingly implied a
  // founding year of the current year).
  const REVIEW_LABELS = {
    restaurant: 'Happy guests', salon: 'Happy clients', trades: 'Jobs done',
    medical: 'Patients', legal: 'Clients', retail: 'Customers',
    catering: 'Events served', laundry: 'Loads done', bakeshop: 'Orders baked',
    gym: 'Members', photography: 'Sessions', petcare: 'Pets cared for',
    gadgetrepair: 'Repairs done', generic: 'Reviews',
  }
  const statCell = (val, label) =>
    `<div><div class="stat-val">${esc(val)}</div><div class="stat-label">${esc(label)}</div></div>`
  const heroStatCells = []
  if (hasRealRating)  heroStatCells.push(statCell(`${rating}★`, 'Rating'))
  if (hasRealReviews) heroStatCells.push(statCell(`${reviewCount}+`, REVIEW_LABELS[categoryKey] || 'Reviews'))
  heroStatCells.push(statCell(city || categoryLabel, city ? 'Proudly local' : 'Locally owned'))
  // Keep at least two stats so the hero never looks bare.
  if (heroStatCells.length < 2) heroStatCells.unshift(statCell(categoryLabel, 'What we do'))
  const HERO_STATS = heroStatCells.join('\n      ')

  // ── Gallery block — uses the real Google Places / stock photos the image
  // pipeline already resolves (previously fetched then discarded by LP templates).
  // Self-contained section; renders empty (→ no section) when no photos exist.
  const GALLERY_TITLES = {
    restaurant: 'A taste of what we serve', salon: 'Our work', trades: 'Recent work',
    medical: 'Our clinic', legal: 'Our practice', retail: 'In store',
    catering: 'From our events', laundry: 'Our shop', bakeshop: 'Fresh from our oven',
    gym: 'Inside the gym', photography: 'Portfolio', petcare: 'Happy visitors',
    gadgetrepair: 'Our workshop', generic: 'Gallery',
  }
  const galleryTitle = GALLERY_TITLES[categoryKey] || 'Gallery'
  const GALLERY_BLOCK = hasGalleryImages ? `
<section class="guma-gallery">
  <div class="gg-eyebrow">GALLERY</div>
  <h2 class="gg-title">${esc(galleryTitle)}</h2>
  <div class="gg-grid">
    ${galleryImages.filter(u => u && u.trim()).map(u =>
      `<img src="${esc(u)}" alt="${esc(name)} — ${esc(categoryLabel)}" loading="lazy">`).join('\n    ')}
  </div>
</section>` : ''

  // ── SEO meta — prefer the strategy-derived title/description from the spec. ──
  const metaTitle = spec?.meta_title || `${name}${city ? ` | ${city}` : ''}`
  const metaDescription = spec?.meta_description || heroSubtext || description

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
    SERVICES_HTML:      servicesHtml,
    TRUST_HTML:         trustHtml,
    PALETTE_CSS,
    LAYOUT_CSS:         '',   // layout variants reverted — see note above
    AMBIANCE_BLOCK,
    HERO_STATS,
    GALLERY_BLOCK,
    META_TITLE:         esc(metaTitle),
    META_DESCRIPTION:   esc(metaDescription),
  }
}

// ─── Content builders ─────────────────────────────────────────────────────────

function buildTagline(name, categoryKey, city) {
  const map = {
    restaurant:   `Great food, great vibes${city ? ` in ${city}` : ''}`,
    salon:        `Look & feel your best${city ? ` in ${city}` : ''}`,
    trades:       `Reliable service${city ? ` across ${city}` : ''} — done right`,
    medical:      `Your health is our priority`,
    legal:        `Experienced legal counsel you can trust`,
    retail:       `Your local favourite${city ? ` in ${city}` : ''}`,
    catering:     `Unforgettable flavors for every occasion`,
    laundry:      `Fresh, clean, on time`,
    bakeshop:     `Freshly baked every day`,
    gym:          `Your strongest self starts here`,
    photography:  `Capturing your story beautifully`,
    petcare:      `Expert care for your fur babies`,
    gadgetrepair: `Fixed fast — or it's free`,
    generic:      `Serving ${city || 'the community'} with pride`,
  }
  return map[categoryKey] || map.generic
}

function buildServices(categoryKey, label) {
  const map = {
    restaurant:   ['Dine In', 'Takeaway', 'Catering', 'Private Events'],
    salon:        ['Haircut & Styling', 'Colour & Highlights', 'Manicure & Pedicure', 'Facials & Skincare'],
    trades:       ['Free Quotes', 'Emergency Callouts', 'Repairs & Maintenance', 'New Installations'],
    medical:      ['General Consultations', 'Preventive Care', 'Specialist Referrals', 'Telehealth'],
    legal:        ['Free Consultation', 'Contract Review', 'Dispute Resolution', 'Legal Advice'],
    retail:       ['In-Store Shopping', 'Online Orders', 'Gift Wrapping', 'Loyalty Rewards'],
    catering:     ['Full Buffet Setup', 'Live Cooking Stations', 'Lechon & Roasts', 'Corkage-Free Packages'],
    laundry:      ['Wash & Fold', 'Dry Cleaning', 'Steam Pressing', 'Pick-Up & Delivery'],
    bakeshop:     ['Freshly Baked Pandesal', 'Specialty Cakes', 'Ensaymada & Rolls', 'Custom Birthday Cakes'],
    gym:          ['Day Passes', 'Monthly Membership', 'Personal Training', 'Group Classes'],
    photography:  ['Portrait Sessions', 'Events Coverage', 'Prenuptial Shoots', 'Product Photography'],
    petcare:      ['Veterinary Consultations', 'Grooming & Bath', 'Pet Boarding', 'Vaccination'],
    gadgetrepair: ['Screen Replacement', 'Battery Replacement', 'Water Damage Repair', 'Software Troubleshooting'],
    generic:      ['Professional Services', 'Consultations', 'Custom Solutions', 'Local Delivery'],
  }
  return map[categoryKey] || map.generic
}

function buildMenuItems(categoryKey) {
  const map = {
    restaurant:   ['Signature Dish', 'Chef\'s Special', 'Daily Special', 'Desserts'],
    salon:        ['Cut & Style', 'Full Colour', 'Blowout', 'Treatment'],
    trades:       ['Standard Service', 'Emergency Call', 'Maintenance Plan', 'Full Install'],
    medical:      ['Initial Consultation', 'Follow-up Visit', 'Health Screening', 'Specialist Review'],
    legal:        ['Initial Consultation', 'Document Review', 'Full Representation', 'Ongoing Retainer'],
    retail:       ['New Arrivals', 'Best Sellers', 'Sale Items', 'Gift Ideas'],
    catering:     ['Boodle Fight Package', 'Birthday Party Package', 'Corporate Lunch', 'Kiddie Party'],
    laundry:      ['Express Wash', 'Bulk Laundry', 'Dry Clean Only', 'Monthly Plan'],
    bakeshop:     ['Pan de Sal', 'Bibingka', 'Ensaymada', 'Ube Cake'],
    gym:          ['Day Pass', 'Monthly', 'Quarterly', 'Annual VIP'],
    photography:  ['Portrait Session', 'Event Coverage', 'Prenup Package', 'Product Shoot'],
    petcare:      ['Consultation', 'Full Grooming', 'Boarding (per night)', 'Vaccination Package'],
    gadgetrepair: ['Screen Fix', 'Battery Fix', 'Full Diagnostic', 'Data Recovery'],
    generic:      ['Service A', 'Service B', 'Package Deal', 'Premium Option'],
  }
  return map[categoryKey] || map.generic
}

function buildTrustPoints(categoryKey, city, rating) {
  const map = {
    restaurant:   [`${rating}★ rated`, `Locally owned`, `Fresh ingredients daily`, `Family friendly`],
    salon:        [`${rating}★ rated`, `Certified stylists`, `Premium products`, `Walk-ins welcome`],
    trades:       [`Licensed & insured`, `${city || 'Local'} based`, `Free quotes`, `Same-day service`],
    medical:      [`Accepting new patients`, `All insurances`, `Same-day appointments`, `Caring staff`],
    legal:        [`Free consultation`, `No win no fee`, `Confidential`, `Experienced team`],
    retail:       [`${rating}★ rated`, `Locally owned`, `Easy returns`, `Loyalty rewards`],
    catering:     [`${rating}★ rated`, `Serving ${city || 'the area'}`, `Flexible packages`, `Halal-friendly options`],
    laundry:      [`Same-day turnaround`, `${city || 'Local'} pick-up`, `Hygienic process`, `Friendly staff`],
    bakeshop:     [`Baked fresh daily`, `No preservatives`, `Custom orders`, `${city || 'Local'} delivery`],
    gym:          [`${rating}★ rated`, `Modern equipment`, `Expert trainers`, `Open 7 days`],
    photography:  [`${rating}★ rated`, `Professional gear`, `Fast turnaround`, `Gallery delivery`],
    petcare:      [`Licensed vet`, `${rating}★ rated`, `Gentle handling`, `Walk-ins welcome`],
    gadgetrepair: [`${rating}★ rated`, `90-day warranty`, `Same-day repair`, `Genuine parts`],
    generic:      [`${rating}★ rated`, `Locally owned`, `Trusted service`, `${city || 'Local'} based`],
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
    restaurant:   'Masarap na pagkain para sa lahat',
    salon:        'Maganda ka sa amin',
    trades:       'Maaasahang serbisyo',
    medical:      'Ang iyong kalusugan ang aming priyoridad',
    legal:        'Ligal na tulong na mapagkakatiwalaan',
    retail:       'Ang iyong paboritong tindahan',
    catering:     'Masarap at memorable ang bawat okasyon',
    laundry:      'Malinis, mabango, maaga pa',
    bakeshop:     'Sariwang-sariwa araw-araw',
    gym:          'Maging mas malakas simula ngayon',
    photography:  'Bawat sandali, iniingatan',
    petcare:      'Mahal namin ang iyong alagang hayop',
    gadgetrepair: 'Ayos agad, garantisado',
    generic:      'Naglilingkod sa komunidad',
  }
  return map[categoryKey] || ''
}
