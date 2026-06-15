import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export interface SelectionContext {
  industry: string
  businessModel: 'service' | 'product' | 'marketplace' | 'saas' | 'subscription' | 'other'
  targetAudience: string
  designPreference?: 'modern' | 'minimal' | 'luxury' | 'playful' | 'corporate'
  category?: string
  description?: string
}

export interface TemplateSelection {
  selectedTemplate: any
  rankedTemplates: Array<{
    template: any
    score: number
    reason: string[]
  }>
  recommendation: string
  suggestedComponents: any[]
}

/**
 * Intelligent Template Selection Engine
 * Analyzes user context and recommends the best template + component combination
 */
export async function selectOptimalTemplate(context: SelectionContext): Promise<TemplateSelection> {
  // Fetch all production templates
  const { data: allTemplates, error } = await supabase
    .from('templates')
    .select('*, template_scores(*)')
    .eq('status', 'production')

  if (error || !allTemplates) {
    throw new Error(`Failed to fetch templates: ${error?.message}`)
  }

  // Score each template against the context
  const scoredTemplates = await Promise.all(
    allTemplates.map(async (template) => ({
      template,
      score: await scoreTemplateForContext(template, context),
      reasons: await getSelectionReasons(template, context),
    }))
  )

  // Sort by score descending
  const ranked = scoredTemplates.sort((a, b) => b.score - a.score)

  // Select top template
  const selected = ranked[0]

  // Find optimal component combination
  const suggestedComponents = await selectOptimalComponents(
    selected.template,
    context
  )

  // Generate explanation
  const recommendation = generateRecommendation(
    selected.template,
    context,
    selected.reasons
  )

  return {
    selectedTemplate: selected.template,
    rankedTemplates: ranked.slice(0, 5).map((r) => ({
      template: r.template,
      score: r.score,
      reason: r.reasons,
    })),
    recommendation,
    suggestedComponents,
  }
}

/**
 * Score a template against the selection context (0-100)
 */
async function scoreTemplateForContext(template: any, context: SelectionContext): Promise<number> {
  let score = 0

  // 1. Industry fit (25 points max)
  const industryMatch = template.industry?.toLowerCase() === context.industry.toLowerCase()
  if (industryMatch) {
    score += 25
  } else if (
    context.category &&
    template.category?.toLowerCase() === context.category.toLowerCase()
  ) {
    score += 15
  }

  // 2. Business model fit (20 points max)
  const businessModelMatch =
    template.business_model?.toLowerCase() === context.businessModel.toLowerCase()
  if (businessModelMatch) score += 20

  // 3. Style preference (15 points max)
  if (context.designPreference && template.style === context.designPreference) {
    score += 15
  }

  // 4. Performance history (25 points max)
  const performanceBonus = Math.min(
    25,
    (template.total_uses || 0) / 100 + // Popularity
      (template.conversion_rate_observed || 0) * 50 + // Conversion rate
      (template.admin_verified ? 5 : 0) // Verified flag
  )
  score += performanceBonus

  // 5. Quality metrics (15 points max)
  const qualityScore = Math.min(
    15,
    (template.seo_score || 0) / 8 + // SEO score
      (template.performance_score || 0) / 8 + // Performance
      (template.accessibility_score || 0) / 8
  )
  score += qualityScore

  return Math.round(Math.min(score, 100))
}

/**
 * Get reasons why this template was selected
 */
async function getSelectionReasons(
  template: any,
  context: SelectionContext
): Promise<string[]> {
  const reasons: string[] = []

  // Industry match
  if (template.industry?.toLowerCase() === context.industry.toLowerCase()) {
    reasons.push(`Built for ${template.industry} industry`)
  }

  // Business model match
  if (template.business_model?.toLowerCase() === context.businessModel.toLowerCase()) {
    reasons.push(`Optimized for ${template.business_model} business model`)
  }

  // Performance
  if (template.total_uses > 100) {
    reasons.push(`Used successfully ${template.total_uses} times`)
  }

  // Conversion history
  if (template.conversion_rate_observed && template.conversion_rate_observed > 0.02) {
    reasons.push(
      `Conversion rate: ${(template.conversion_rate_observed * 100).toFixed(1)}%`
    )
  }

  // Quality metrics
  if (template.seo_score && template.seo_score > 80) {
    reasons.push(`High SEO score (${template.seo_score}/100)`)
  }

  if (template.performance_score && template.performance_score > 80) {
    reasons.push(`Fast loading (${template.performance_score}/100)`)
  }

  // Style match
  if (context.designPreference && template.style === context.designPreference) {
    reasons.push(`Matches ${context.designPreference} design preference`)
  }

  // User ratings
  if (template.avg_user_rating && template.avg_user_rating > 4.0) {
    reasons.push(`Highly rated (${template.avg_user_rating.toFixed(1)}/5 stars)`)
  }

  return reasons.slice(0, 5)
}

/**
 * Select optimal component combination from available components
 */
async function selectOptimalComponents(template: any, context: SelectionContext): Promise<any[]> {
  // Get components from this template
  const { data: components } = await supabase
    .from('components')
    .select('*')
    .in('extracted_from_templates', [template.id])
    .limit(7) // Hero, nav, features, pricing, testimonials, cta, footer

  if (!components) return []

  // Rank components for conversion/performance
  const ranked = components.sort(
    (a, b) =>
      (b.used_in_websites || 0) - (a.used_in_websites || 0) ||
      (b.avg_rating || 0) - (a.avg_rating || 0)
  )

  return ranked
}

/**
 * Generate human-readable explanation for the recommendation
 */
function generateRecommendation(
  template: any,
  context: SelectionContext,
  reasons: string[]
): string {
  const reasonText =
    reasons.length > 0
      ? ` because it ${reasons.join(', ')}. `
      : '. '

  return (
    `We selected the "${template.name}" template for your ${context.industry} business${reasonText}` +
    `This template has been tested with real businesses and comes with pre-optimized sections ` +
    `for hero, features, pricing, testimonials, and contact forms. You can customize colors, fonts, ` +
    `and content without needing technical skills.`
  )
}

/**
 * Get templates recommended for a specific industry
 */
export async function getTemplatesForIndustry(industry: string) {
  const { data } = await supabase
    .from('templates')
    .select('*')
    .eq('industry', industry)
    .eq('status', 'production')
    .order('total_uses', { ascending: false })

  return data || []
}

/**
 * Get trending templates (by recent usage)
 */
export async function getTrendingTemplates(limit = 10) {
  const { data } = await supabase
    .from('templates')
    .select('*')
    .eq('status', 'production')
    .order('total_uses', { ascending: false })
    .limit(limit)

  return data || []
}

/**
 * Get high-converting templates
 */
export async function getHighConvertingTemplates(limit = 10) {
  const { data } = await supabase
    .from('templates')
    .select('*')
    .eq('status', 'production')
    .gt('conversion_rate_observed', 0.02)
    .order('conversion_rate_observed', { ascending: false })
    .limit(limit)

  return data || []
}

/**
 * Create component combination record (for mix-and-match)
 */
export async function createComponentCombination(
  templateId: string,
  heroComponentId: string,
  featuresComponentId: string,
  pricingComponentId: string,
  testimonialsComponentId: string,
  faqComponentId: string,
  ctaComponentId: string,
  footerComponentId: string
) {
  const { data, error } = await supabase
    .from('component_combinations')
    .insert([
      {
        template_id: templateId,
        hero_component_id: heroComponentId,
        features_component_id: featuresComponentId,
        pricing_component_id: pricingComponentId,
        testimonials_component_id: testimonialsComponentId,
        faq_component_id: faqComponentId,
        cta_component_id: ctaComponentId,
        footer_component_id: footerComponentId,
        compatibility_score: 85,
        works_well_together: true,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Log template recommendation (for analytics)
 */
export async function logTemplateRecommendation(
  templateId: string,
  websiteId: string | null,
  context: SelectionContext,
  reasons: string[],
  confidenceScore: number
) {
  const { error } = await supabase
    .from('template_recommendations')
    .insert([
      {
        template_id: templateId,
        website_id: websiteId,
        matched_industry: context.industry !== '',
        matched_business_model: context.businessModel !== '',
        matched_audience: context.targetAudience !== '',
        matched_style_preference: context.designPreference !== undefined,
        high_performance_history: false,
        high_conversion_history: false,
        recommendation_reason: reasons.join('; '),
        confidence_score: confidenceScore / 100,
      },
    ])

  if (error) throw error
}
