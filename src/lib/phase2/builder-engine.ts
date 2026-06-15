import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export interface BuilderInput {
  userId: string
  websiteId: string
  baseTemplateId: string
  industry: string
}

export interface ComponentAssembly {
  heroComponentId: string
  featuresComponentId: string
  pricingComponentId: string
  testimonialsComponentId: string
  faqComponentId: string
  ctaComponentId: string
  footerComponentId: string
}

/**
 * Create a new premium builder session
 * User starts from template, customizes components & content
 */
export async function createBuilderSession(input: BuilderInput) {
  // Verify user has active premium subscription
  const hasAccess = await verifyPremiumAccess(input.userId)
  if (!hasAccess) throw new Error('Premium subscription required')

  const { data, error } = await supabase
    .from('premium_builder_sessions')
    .insert([
      {
        user_id: input.userId,
        website_id: input.websiteId,
        base_template_id: input.baseTemplateId,
        status: 'draft',
        visible_sections: ['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta', 'footer'],
        section_order: ['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta', 'footer'],
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Assemble optimal components for the session
 * Mix-and-match components from template library
 */
export async function assembleComponents(sessionId: string, assembly: ComponentAssembly) {
  const { data, error } = await supabase
    .from('premium_builder_sessions')
    .update({
      hero_component_id: assembly.heroComponentId,
      features_component_id: assembly.featuresComponentId,
      pricing_component_id: assembly.pricingComponentId,
      testimonials_component_id: assembly.testimonialsComponentId,
      faq_component_id: assembly.faqComponentId,
      cta_component_id: assembly.ctaComponentId,
      footer_component_id: assembly.footerComponentId,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Apply color system to session
 * Swap colors while maintaining design coherence
 */
export async function applyColorSystem(sessionId: string, colorSystemId: string) {
  // Fetch color system
  const { data: colorSystem, error: fetchError } = await supabase
    .from('color_systems')
    .select('*')
    .eq('id', colorSystemId)
    .single()

  if (fetchError || !colorSystem) throw new Error('Color system not found')

  // Apply to session
  const { data, error } = await supabase
    .from('premium_builder_sessions')
    .update({
      selected_color_system: colorSystem.name,
      custom_primary_color: colorSystem.primary_color,
      custom_secondary_color: colorSystem.secondary_color,
      custom_accent_color: colorSystem.accent_color,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Apply typography system
 */
export async function applyTypographySystem(sessionId: string, typographySystemId: string) {
  const { data: typography, error: fetchError } = await supabase
    .from('typography_systems')
    .select('*')
    .eq('id', typographySystemId)
    .single()

  if (fetchError || !typography) throw new Error('Typography system not found')

  const { data, error } = await supabase
    .from('premium_builder_sessions')
    .update({
      selected_typography_system: typography.name,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update hero section content
 */
export async function updateHeroSection(
  sessionId: string,
  headline: string,
  subheading: string,
  ctaText: string
) {
  const { data, error } = await supabase
    .from('premium_builder_sessions')
    .update({
      hero_headline: headline,
      hero_subheading: subheading,
      hero_cta_text: ctaText,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error

  // Log edit
  await logComponentEdit(sessionId, null, 'text_edit', 'hero', null, JSON.stringify({ headline, subheading }))

  return data
}

/**
 * Update features section content
 */
export async function updateFeaturesSection(
  sessionId: string,
  features: Array<{ headline: string; description: string }>
) {
  const headlines = features.map((f) => f.headline)
  const descriptions = features.map((f) => f.description)

  const { data, error } = await supabase
    .from('premium_builder_sessions')
    .update({
      feature_headlines: headlines,
      feature_descriptions: descriptions,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error

  await logComponentEdit(sessionId, null, 'text_edit', 'features', null, JSON.stringify(features))

  return data
}

/**
 * Update pricing section content
 */
export async function updatePricingSection(
  sessionId: string,
  pricingTiers: Array<{ name: string; price: number; features: string[] }>
) {
  const { data, error } = await supabase
    .from('premium_builder_sessions')
    .update({
      pricing_tiers: pricingTiers,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error

  await logComponentEdit(sessionId, null, 'text_edit', 'pricing', null, JSON.stringify(pricingTiers))

  return data
}

/**
 * Reorder visible sections
 */
export async function reorderSections(sessionId: string, newOrder: string[]) {
  const { data, error } = await supabase
    .from('premium_builder_sessions')
    .update({
      section_order: newOrder,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error

  await logComponentEdit(sessionId, null, 'layout_change', 'sections', null, JSON.stringify(newOrder))

  return data
}

/**
 * Toggle section visibility
 */
export async function toggleSectionVisibility(sessionId: string, section: string, visible: boolean) {
  const { data: session, error: fetchError } = await supabase
    .from('premium_builder_sessions')
    .select('visible_sections')
    .eq('id', sessionId)
    .single()

  if (fetchError || !session) throw new Error('Session not found')

  let updatedSections = session.visible_sections || []

  if (visible && !updatedSections.includes(section)) {
    updatedSections.push(section)
  } else if (!visible && updatedSections.includes(section)) {
    updatedSections = updatedSections.filter((s) => s !== section)
  }

  const { data, error } = await supabase
    .from('premium_builder_sessions')
    .update({
      visible_sections: updatedSections,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Generate website HTML from customized components
 */
export async function generateWebsiteHTML(sessionId: string): Promise<string> {
  const { data: session, error } = await supabase
    .from('premium_builder_sessions')
    .select(
      `*,
       base_template:templates(*),
       hero_component:components!hero_component_id(*),
       features_component:components!features_component_id(*),
       pricing_component:components!pricing_component_id(*),
       testimonials_component:components!testimonials_component_id(*),
       faq_component:components!faq_component_id(*),
       cta_component:components!cta_component_id(*),
       footer_component:components!footer_component_id(*)`
    )
    .eq('id', sessionId)
    .single()

  if (error || !session) throw new Error('Session not found')

  // Start with base template
  let html = session.base_template?.html_content || ''
  let css = session.base_template?.css_content || ''

  // Inject color variables into CSS
  if (session.custom_primary_color) {
    css = injectCSSVariables(css, {
      primary: session.custom_primary_color,
      secondary: session.custom_secondary_color,
      accent: session.custom_accent_color,
    })
  }

  // Replace hero section
  if (session.hero_component && session.visible_sections?.includes('hero')) {
    const heroHTML = replaceHeroContent(
      session.hero_component.html_snippet,
      session.hero_headline,
      session.hero_subheading,
      session.hero_cta_text
    )
    html = replaceSection(html, 'hero', heroHTML)
  }

  // Replace features section
  if (session.features_component && session.visible_sections?.includes('features')) {
    const featuresHTML = replaceFeatures(
      session.features_component.html_snippet,
      session.feature_headlines || [],
      session.feature_descriptions || []
    )
    html = replaceSection(html, 'features', featuresHTML)
  }

  // Replace pricing section
  if (session.pricing_component && session.visible_sections?.includes('pricing')) {
    const pricingHTML = replacePricing(
      session.pricing_component.html_snippet,
      session.pricing_tiers || []
    )
    html = replaceSection(html, 'pricing', pricingHTML)
  }

  // Replace footer
  if (session.footer_component && session.visible_sections?.includes('footer')) {
    const footerHTML = replaceFooterContent(
      session.footer_component.html_snippet,
      session.footer_company_name,
      session.footer_email,
      session.footer_phone
    )
    html = replaceSection(html, 'footer', footerHTML)
  }

  // Reorder sections if needed
  html = reorderSectionsInHTML(html, session.section_order || [])

  // Combine HTML + CSS
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>
${html}
</body>
</html>`
}

/**
 * Publish premium website
 */
export async function publishPremiumWebsite(sessionId: string): Promise<string> {
  const html = await generateWebsiteHTML(sessionId)

  // Save to website record
  const { data: session } = await supabase
    .from('premium_builder_sessions')
    .select('website_id')
    .eq('id', sessionId)
    .single()

  if (!session) throw new Error('Session not found')

  await supabase
    .from('websites')
    .update({
      html_content: html,
      status: 'published',
    })
    .eq('id', session.website_id)

  // Update builder session
  await supabase
    .from('premium_builder_sessions')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  return html
}

/**
 * Create website variant for A/B testing
 */
export async function createWebsiteVariant(
  sessionId: string,
  variantName: string,
  variantType: 'color_swap' | 'layout_variation' | 'copy_variation' | 'component_swap'
): Promise<string> {
  const html = await generateWebsiteHTML(sessionId)

  const { data, error } = await supabase
    .from('website_variants')
    .insert([
      {
        session_id: sessionId,
        variant_name: variantName,
        variant_type: variantType,
        html_content: html,
      },
    ])
    .select()
    .single()

  if (error) throw error

  // Increment variant count
  await supabase
    .from('premium_builder_sessions')
    .update({
      variant_count: (await getVariantCount(sessionId)) + 1,
    })
    .eq('id', sessionId)

  return data.id
}

// ============ HELPERS ============

async function verifyPremiumAccess(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  return !error && !!data
}

function injectCSSVariables(css: string, colors: Record<string, string>): string {
  let injected = ':root {\n'
  for (const [key, value] of Object.entries(colors)) {
    injected += `  --color-${key}: ${value};\n`
  }
  injected += '}\n\n' + css

  // Replace hardcoded colors with variables
  for (const [key, value] of Object.entries(colors)) {
    injected = injected.replace(new RegExp(value, 'g'), `var(--color-${key})`)
  }

  return injected
}

function replaceHeroContent(
  heroHTML: string,
  headline: string,
  subheading: string,
  ctaText: string
): string {
  let html = heroHTML
  html = html.replace(/<h1[^>]*>[^<]*<\/h1>/, `<h1>${headline}</h1>`)
  html = html.replace(/<h2[^>]*>[^<]*<\/h2>|<p class="subtitle">[^<]*<\/p>/, `<p>${subheading}</p>`)
  html = html.replace(/<button[^>]*>[^<]*<\/button>|<a[^>]*class="cta"[^>]*>[^<]*<\/a>/, `<button>${ctaText}</button>`)
  return html
}

function replaceFeatures(
  featuresHTML: string,
  headlines: string[],
  descriptions: string[]
): string {
  let html = featuresHTML
  headlines.forEach((headline, idx) => {
    html = html.replace(
      new RegExp(`<h3[^>]*>.*?</h3>`, 'm'),
      `<h3>${headline}</h3>`,
      1
    )
  })
  descriptions.forEach((desc, idx) => {
    html = html.replace(
      new RegExp(`<p[^>]*>.*?</p>`, 'm'),
      `<p>${desc}</p>`,
      1
    )
  })
  return html
}

function replacePricing(pricingHTML: string, tiers: any[]): string {
  // Generate pricing cards from tier data
  let tiersHTML = ''
  tiers.forEach((tier) => {
    tiersHTML += `
      <div class="pricing-card">
        <h3>${tier.name}</h3>
        <div class="price">$${tier.price}</div>
        <ul>
          ${tier.features.map((f) => `<li>${f}</li>`).join('')}
        </ul>
        <button>Get Started</button>
      </div>
    `
  })
  return pricingHTML.replace(/<div class="pricing-cards">.*?<\/div>/s, `<div class="pricing-cards">${tiersHTML}</div>`)
}

function replaceFooterContent(
  footerHTML: string,
  company: string,
  email: string,
  phone: string
): string {
  let html = footerHTML
  if (company) html = html.replace(/<p class="company">[^<]*<\/p>/, `<p class="company">${company}</p>`)
  if (email) html = html.replace(/[\w.-]+@[\w.-]+\.\w+/, email)
  if (phone) html = html.replace(/\(\d{3}\) \d{3}-\d{4}/, phone)
  return html
}

function replaceSection(html: string, sectionName: string, newContent: string): string {
  const regex = new RegExp(`<section[^>]*class="[^"]*${sectionName}[^"]*"[^>]*>.*?<\/section>`, 's')
  return html.replace(regex, `<section class="${sectionName}">${newContent}</section>`)
}

function reorderSectionsInHTML(html: string, order: string[]): string {
  // Extract all sections
  const sectionRegex = /<section[^>]*class="[^"]*(\w+)[^"]*"[^>]*>.*?<\/section>/gs
  const sections: Record<string, string> = {}

  let match
  while ((match = sectionRegex.exec(html)) !== null) {
    const sectionName = match[1]
    sections[sectionName] = match[0]
  }

  // Rebuild in new order
  let reordered = ''
  order.forEach((name) => {
    if (sections[name]) reordered += sections[name]
  })

  return html.replace(sectionRegex, '') + reordered
}

async function logComponentEdit(
  sessionId: string,
  componentId: string | null,
  editType: string,
  section: string,
  originalValue: string | null,
  newValue: string
) {
  await supabase.from('component_edits').insert([
    {
      session_id: sessionId,
      component_id: componentId,
      edit_type: editType,
      section_name: section,
      original_value: originalValue,
      new_value: newValue,
    },
  ])
}

async function getVariantCount(sessionId: string): Promise<number> {
  const { count } = await supabase
    .from('website_variants')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  return count || 0
}
