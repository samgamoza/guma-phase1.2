import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

interface RewriteRequest {
  sessionId: string
  section: 'hero' | 'features' | 'pricing' | 'testimonials' | 'faq'
  originalContent: string
  style?: 'casual' | 'professional' | 'playful' | 'persuasive' | 'technical'
  tone?: 'friendly' | 'formal' | 'humorous' | 'authoritative'
  businessContext?: string // e.g., "SaaS company targeting startups"
}

interface RewriteResult {
  rewriteId: string
  rewrittenContent: string
  explanation: string
}

/**
 * AI-powered content rewriting for website sections
 * Uses Claude to improve copy while maintaining brand voice
 */
export async function rewriteSection(request: RewriteRequest): Promise<RewriteResult> {
  // Verify rewrite quota
  const hasRewriteQuota = await verifyRewriteQuota(request.sessionId)
  if (!hasRewriteQuota) throw new Error('AI rewrite quota exceeded')

  // Build prompt based on section
  const prompt = buildRewritePrompt(request)

  // Call Claude API
  const rewrittenContent = await callClaudeAPI(prompt)

  // Save rewrite history
  const { data: rewrite, error } = await supabase
    .from('ai_rewrites')
    .insert([
      {
        session_id: request.sessionId,
        section: request.section,
        original_content: request.originalContent,
        rewritten_content: rewrittenContent,
        rewrite_style: request.style || 'professional',
        tone: request.tone || 'friendly',
        prompt_used: prompt,
        model_used: 'claude-sonnet-4-6',
      },
    ])
    .select()
    .single()

  if (error) throw error

  // Decrement rewrite quota
  await decrementRewriteQuota(request.sessionId)

  return {
    rewriteId: rewrite.id,
    rewrittenContent,
    explanation: `Rewritten in ${request.style || 'professional'} style with ${request.tone || 'friendly'} tone.`,
  }
}

/**
 * Generate multiple copy variations for A/B testing
 */
export async function generateCopyVariations(
  sessionId: string,
  section: string,
  originalContent: string,
  count: number = 3
): Promise<string[]> {
  const variations: string[] = []

  const styles = ['casual', 'professional', 'playful'] as const
  const tones = ['friendly', 'formal', 'humorous'] as const

  for (let i = 0; i < count; i++) {
    const style = styles[i % styles.length]
    const tone = tones[i % tones.length]

    const result = await rewriteSection({
      sessionId,
      section: section as any,
      originalContent,
      style,
      tone,
    })

    variations.push(result.rewrittenContent)
  }

  return variations
}

/**
 * Generate hero section copy from business description
 */
export async function generateHeroCopy(
  sessionId: string,
  businessName: string,
  businessDescription: string,
  targetAudience: string
): Promise<string> {
  const prompt = `You are a copywriting expert. Create a compelling hero section for a website.

Business Name: ${businessName}
Business Description: ${businessDescription}
Target Audience: ${targetAudience}

Generate a JSON object with:
{
  "headline": "Attention-grabbing main heading (6-10 words)",
  "subheading": "Supporting subheading (15-20 words)",
  "ctaText": "Call-to-action button text (2-3 words)"
}

Make it persuasive, conversion-focused, and relevant to the target audience.`

  const response = await callClaudeAPI(prompt)

  try {
    const data = JSON.parse(response)
    return JSON.stringify(data)
  } catch {
    return response
  }
}

/**
 * Generate features copy from business capabilities
 */
export async function generateFeaturesCopy(
  sessionId: string,
  businessFeatures: string[]
): Promise<Array<{ headline: string; description: string }>> {
  const prompt = `You are a product copywriter. Create compelling feature descriptions.

Features to describe:
${businessFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

For each feature, generate a JSON array with objects like:
{
  "headline": "Feature name (2-4 words)",
  "description": "Benefit-focused description (15-25 words)"
}

Focus on benefits, not technical details.`

  const response = await callClaudeAPI(prompt)

  try {
    return JSON.parse(response)
  } catch {
    return businessFeatures.map((f) => ({
      headline: f,
      description: `${f} helps your business succeed.`,
    }))
  }
}

/**
 * Generate pricing section copy
 */
export async function generatePricingCopy(
  sessionId: string,
  pricingTiers: Array<{ name: string; price: number; features: string[] }>
): Promise<string> {
  const prompt = `You are a pricing strategist. Create compelling pricing page copy.

Pricing Tiers:
${pricingTiers
  .map(
    (tier) => `
${tier.name} - $${tier.price}/month
${tier.features.map((f) => `  - ${f}`).join('\n')}
`
  )
  .join('\n')}

Generate a JSON object with:
{
  "headline": "Main pricing heading",
  "subheading": "Supporting text",
  "ctaText": "Call-to-action on pricing cards"
}

Make it persuasive and focus on value.`

  const response = await callClaudeAPI(prompt)

  try {
    return JSON.stringify(JSON.parse(response))
  } catch {
    return response
  }
}

/**
 * Improve existing copy for better conversion
 */
export async function optimizeForConversion(
  sessionId: string,
  section: string,
  content: string
): Promise<string> {
  const prompt = `You are a conversion rate optimization expert. Improve this copy for higher conversions.

Current Copy:
${content}

Guidelines:
1. Make the value proposition clear immediately
2. Use power words and emotional triggers
3. Include specific benefits, not just features
4. Add a clear call-to-action
5. Remove weak language and vague statements

Provide only the improved copy, no explanations.`

  return await callClaudeAPI(prompt)
}

// ============ HELPERS ============

async function verifyRewriteQuota(sessionId: string): Promise<boolean> {
  const { data: session } = await supabase
    .from('premium_builder_sessions')
    .select('user_id')
    .eq('id', sessionId)
    .single()

  if (!session) return false

  // Get user's subscription
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*, subscription_tiers(*)')
    .eq('user_id', session.user_id)
    .eq('status', 'active')
    .single()

  if (!subscription?.subscription_tiers) return false

  // Check quota
  const remaining =
    (subscription.subscription_tiers.ai_rewrites_per_month || 0) -
    (subscription.ai_rewrites_used || 0)

  return remaining > 0
}

async function decrementRewriteQuota(sessionId: string) {
  const { data: session } = await supabase
    .from('premium_builder_sessions')
    .select('user_id')
    .eq('id', sessionId)
    .single()

  if (!session) return

  // Increment user's usage
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('ai_rewrites_used')
    .eq('user_id', session.user_id)
    .single()

  await supabase
    .from('user_subscriptions')
    .update({
      ai_rewrites_used: (subscription?.ai_rewrites_used || 0) + 1,
    })
    .eq('user_id', session.user_id)

  // Also track in session
  await supabase
    .from('premium_builder_sessions')
    .update({
      ai_rewrites_used: (await getSessionRewriteCount(sessionId)) + 1,
    })
    .eq('id', sessionId)
}

async function getSessionRewriteCount(sessionId: string): Promise<number> {
  const { count } = await supabase
    .from('ai_rewrites')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  return count || 0
}

function buildRewritePrompt(request: RewriteRequest): string {
  const styleGuide = `
Style: ${request.style || 'professional'}
Tone: ${request.tone || 'friendly'}
${request.businessContext ? `Context: ${request.businessContext}` : ''}
`

  const sectionGuides: Record<string, string> = {
    hero: `Rewrite this hero section copy to be more compelling and conversion-focused.
Focus on: immediate value proposition, emotional appeal, clear CTA`,
    features: `Rewrite these feature descriptions to emphasize benefits, not just features.
Use benefit-driven language that resonates with the target audience.`,
    pricing: `Rewrite pricing page copy to reduce friction and increase conversions.
Emphasize value, not price. Address common objections.`,
    testimonials: `Rewrite testimonials to be more authentic and persuasive.
Include specific results and outcomes.`,
    faq: `Rewrite FAQ answers to address pain points and build trust.
Be concise but thorough.`,
  }

  return `You are an expert copywriter specializing in website conversion optimization.

${styleGuide}

Section: ${request.section}
${sectionGuides[request.section] || ''}

Original Copy:
${request.originalContent}

Rewrite this copy to improve clarity, persuasion, and conversion potential.
Maintain the core message but enhance the language and structure.
Provide only the rewritten copy, no explanations.`
}

async function callClaudeAPI(prompt: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.content[0].text
}
