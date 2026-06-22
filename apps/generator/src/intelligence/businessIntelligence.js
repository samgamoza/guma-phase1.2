/**
 * Business Intelligence — pre-generation pipeline stage.
 *
 * Invokes the Business Intelligence & Website Strategy Agent on a business's
 * raw data and returns a strategic blueprint (BusinessDNA) plus telemetry.
 *
 * Pipeline position:  crawl → [business_intelligence] → planning → generation → validation → deployment
 *
 * The actual model call lives in callAgent() — the single swap point. Today it
 * is a direct Claude API call (correct primitive for a stateless data→JSON
 * agent, and immediately testable). To route through a Managed Agent
 * deployment instead, replace callAgent()'s internals with a sessions.create →
 * events.send → poll → parse flow; nothing else in this file changes.
 */
import Anthropic from '@anthropic-ai/sdk'
import { BUSINESS_INTELLIGENCE_SYSTEM_PROMPT } from './agentPrompt.js'
import { logger } from '../utils/logger.js'

const MODEL       = process.env.BUSINESS_INTEL_MODEL || 'claude-haiku-4-5'
// The prompt bounds output (arrays <=5, one-sentence strings) so it lands
// ~3.5-4.5K tokens; this ceiling is safety headroom above that. If a business
// still truncates, the prompt limits — not this number — are the lever.
const MAX_TOKENS  = parseInt(process.env.BUSINESS_INTEL_MAX_TOKENS || '6000', 10)
const MAX_RETRIES = 3

// $ per 1M tokens — used for the business_intelligence_cost telemetry metric.
const RATES = {
  'claude-haiku-4-5':  { input: 1, output: 5 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-opus-4-8':   { input: 5, output: 25 },
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/** Map a businesses row to the agent's input contract. */
export function buildAgentInputs(business) {
  const rd = business.raw_data || {}
  return {
    companyName:      business.name || 'Local Business',
    websiteUrl:       rd.website_url || business.source_url || null,
    crawlData: {
      category:    business.category || null,
      city:        business.city || null,
      country:     business.country || null,
      phone:       business.phone || null,
      email:       business.email || null,
      address:     business.address || null,
      rating:      rd.rating || null,
      reviewCount: rd.review_count || rd.reviewCount || 0,
      category_raw: rd.category_raw || null,
    },
    socialProfiles:   rd.social_links || rd.socials || {},
    reviews: {
      rating:      rd.rating || null,
      count:       rd.review_count || rd.reviewCount || 0,
      highlights:  rd.review_highlights || [],
    },
    extractedContent: rd.description || rd.about || null,
    directoryData: {
      source:   business.source_dir || null,
      features: rd.features || rd.amenities || [],
      services: rd.services || [],
      hours:    rd.hours || null,
      tagline:  rd.tagline || rd.slogan || null,
    },
  }
}

function computeCost(model, usage) {
  const rate = RATES[model] || RATES['claude-haiku-4-5']
  const inTok  = usage?.input_tokens  || 0
  const outTok = usage?.output_tokens || 0
  return Number(((inTok * rate.input + outTok * rate.output) / 1e6).toFixed(6))
}

/** Tolerant JSON extraction — strips code fences and isolates the outer object. */
function parseDna(text) {
  if (!text) throw new Error('Empty agent response')
  let s = text.trim()
  // strip ```json ... ``` fences if the model added them
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  // isolate the outermost JSON object
  const first = s.indexOf('{')
  const last  = s.lastIndexOf('}')
  if (first === -1 || last === -1 || last <= first) throw new Error('No JSON object in agent response')
  const dna = JSON.parse(s.slice(first, last + 1))
  if (!dna.classification || !dna.website_strategy || !dna.hero_variants) {
    throw new Error('Agent JSON missing required keys (classification / website_strategy / hero_variants)')
  }
  return dna
}

/**
 * callAgent — the single invocation point (swap here for Managed Agents).
 * Returns { dna, usage, model }.
 */
async function callAgent(inputs) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: BUSINESS_INTELLIGENCE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(inputs, null, 2) }],
  })

  // A max_tokens stop guarantees truncated (invalid) JSON — surface it clearly.
  if (response.stop_reason === 'max_tokens') {
    throw new Error(`Agent output truncated at max_tokens=${MAX_TOKENS} — raise BUSINESS_INTEL_MAX_TOKENS`)
  }

  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('')
  const dna  = parseDna(text)
  return { dna, usage: response.usage, model: response.model || MODEL }
}

/**
 * runBusinessIntelligence — the stage entry point.
 * Retries up to 3 times. Returns { dna, telemetry }.
 * On total failure, dna is null and telemetry.success is false (caller falls back).
 */
export async function runBusinessIntelligence(business) {
  const inputs = buildAgentInputs(business)
  const start  = Date.now()
  let lastError = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { dna, usage, model } = await callAgent(inputs)

      const telemetry = {
        business_intelligence_duration: Date.now() - start,   // ms
        business_intelligence_success:  true,
        business_intelligence_tokens:   (usage?.input_tokens || 0) + (usage?.output_tokens || 0),
        business_intelligence_cost:     computeCost(model, usage),
        attempts: attempt,
        model,
      }

      // stamp telemetry + provenance onto the DNA so it persists with the record
      dna._meta = {
        generated_at: new Date().toISOString(),
        ...telemetry,
      }

      logger.info(
        `[BI] "${business.name}" → niche: ${dna.classification?.niche || 'n/a'} ` +
        `(${telemetry.business_intelligence_tokens} tok, $${telemetry.business_intelligence_cost}, ` +
        `${telemetry.business_intelligence_duration}ms, attempt ${attempt})`
      )
      return { dna, telemetry }
    } catch (err) {
      lastError = err
      logger.warn(`[BI] attempt ${attempt}/${MAX_RETRIES} failed for "${business.name}": ${err.message}`)
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, attempt * 800))
    }
  }

  const telemetry = {
    business_intelligence_duration: Date.now() - start,
    business_intelligence_success:  false,
    business_intelligence_tokens:   0,
    business_intelligence_cost:     0,
    attempts: MAX_RETRIES,
    error: lastError?.message || 'unknown',
  }
  logger.error(`[BI] FAILED after ${MAX_RETRIES} retries for "${business.name}" — falling back. ${lastError?.message}`)
  return { dna: null, telemetry }
}
