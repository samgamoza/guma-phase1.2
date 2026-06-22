import Anthropic from '@anthropic-ai/sdk'
import { logger } from '../utils/logger.js'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 900

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You generate website content as compact JSON. Output valid JSON only — no markdown, no explanation, no code fences.`

/**
 * Calls Claude Haiku to produce a structured content_spec for a business.
 * The spec is saved to the DB and reused for all future re-renders — Haiku
 * is only called once per business ever.
 */
export async function generateContentSpec(business, categoryKey, categoryConfig) {
  const rd      = business.raw_data || {}
  const name    = business.name     || 'Local Business'
  const city    = business.city     || ''
  const country = business.country  || 'US'
  const category = business.category || categoryConfig.label

  const knownServices = Array.isArray(rd.services) && rd.services.length
    ? rd.services.slice(0, 10).join(', ')
    : 'none listed'

  const userPrompt = `Business: ${name}
Category: ${category}
City: ${city || 'unknown'}, ${country}
Description: ${rd.description || 'none'}
Known offerings: ${knownServices}
Rating: ${rd.rating || 'n/a'} stars · ${rd.review_count || 0} reviews
Slogan: ${rd.tagline || rd.slogan || 'none'}
Features: ${rd.features?.join(', ') || 'none'}

Produce this JSON object with ALL fields filled. Infer intelligently where data is missing:
{
  "tagline": "punchy hero headline, max 10 words, specific to this exact business",
  "hero_subtext": "1–2 sentences: what makes them great, mention city if known",
  "about_text": "2–3 sentences: what they do, who they serve, their key strength",
  "offering_type": "services OR products OR menu OR mixed",
  "offerings": [
    {"name": "offering name", "desc": "one clear sentence"},
    {"name": "offering name", "desc": "one clear sentence"},
    {"name": "offering name", "desc": "one clear sentence"},
    {"name": "offering name", "desc": "one clear sentence"}
  ],
  "trust_points": ["specific trust point 1", "specific trust point 2", "specific trust point 3"],
  "cta_primary": "3–5 word primary CTA",
  "hero_image_query": "8-word specific Unsplash query matching this exact business type",
  "gallery_queries": [
    "7-word query showing one aspect of their work",
    "7-word query showing a second aspect",
    "7-word query showing a third aspect"
  ],
  "personality": "professional OR friendly OR luxury OR clinical OR authoritative"
}

Rules:
- offerings: if known offerings provided, use them (up to 6). Otherwise infer from category.
- offering_type: use "products" for retail/hardware/clothing, "menu" for restaurants/cafes, "services" for trades/medical/legal, "mixed" if both.
- hero_image_query: be very specific. Not "business exterior" but "exterior house painting contractor scaffolding sunny".
- gallery_queries: each query must show a DIFFERENT visual aspect (e.g. a process, a result, a specific service).
- trust_points: make them specific. Use the actual rating, mention city, mention years if known from description.`

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: '{' },
        ],
      })

      const raw  = '{' + response.content.filter(b => b.type === 'text').map(b => b.text).join('')
      const spec = JSON.parse(raw)

      if (!spec.tagline || !spec.offering_type || !Array.isArray(spec.offerings)) {
        throw new Error('Missing required fields in content spec')
      }

      spec.generated_at    = new Date().toISOString()
      spec.model           = MODEL
      spec.input_tokens    = response.usage?.input_tokens  || 0
      spec.output_tokens   = response.usage?.output_tokens || 0

      logger.info(`[ContentAgent] Spec generated for "${name}"`, {
        offering_type: spec.offering_type,
        offerings:     spec.offerings.length,
        personality:   spec.personality,
        tokens:        (spec.input_tokens + spec.output_tokens),
      })

      return spec
    } catch (err) {
      if (attempt === 3) throw new Error(`[ContentAgent] Failed after 3 attempts for "${name}": ${err.message}`)
      logger.warn(`[ContentAgent] Attempt ${attempt} failed — retrying`, { error: err.message })
      await new Promise(r => setTimeout(r, attempt * 600))
    }
  }
}
