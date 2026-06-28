/**
 * Validate & Refine — autonomous post-generation QA stage.
 *
 * Adapts the "iterative refinement" step of interactive AI web builders (where a
 * human reviews the output and issues targeted fix-up prompts) to Guma's
 * no-human, at-scale pipeline. After a site is rendered we run a content-quality
 * pass that the structural `_validateHtml` check never covered:
 *
 *   render → [validate & refine] → save → outreach
 *
 * Two layers, cost-ordered:
 *   1. validateAndRefine()  — pure, free. Heuristic checks + safe deterministic
 *      repairs on the HTML string. Returns the (possibly repaired) HTML plus a
 *      structured quality report. Catches exactly the failure modes that make a
 *      generated site look templated/fake (leaked filler, empty sections,
 *      duplicated tagline, unbounded SEO meta, unresolved tokens).
 *   2. llmRepairSpec()      — optional, paid, gated. A single cheap Haiku call
 *      that rewrites only the broken content_spec fields, so a re-render fixes
 *      the issue. Invoked by the worker ONLY when enabled AND the lead is worth
 *      the spend (see worker.js gating) — the long tail stays zero-cost.
 */

import { logger } from '../utils/logger.js'

// SEO length bounds (chars). Over-long is auto-truncated; under-long is flagged.
const SEO = { titleMin: 10, titleMax: 60, descMin: 50, descMax: 160 }

// Hardcoded generic offerings that should never reach a live site — their
// presence means the real offerings (spec/BI) were missing and the worst-case
// fallback leaked. See buildMenuItems('generic') in templateEngine.js.
const GENERIC_FILLER = ['Service A', 'Service B', 'Service C', 'Package Deal', 'Premium Option']

const norm = (s) => (s || '').trim().toLowerCase().replace(/\s+/g, ' ')

// SEO length must be measured on the DECODED text — an escaped "&amp;" is one
// visible char, not five — and truncation must never split an HTML entity.
const decodeEntities = (s) => (s || '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
const escapeAttr = (s) => (s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const clip = (text, max) => text.slice(0, max - 1).trimEnd() + '…'

/**
 * Run the heuristic QA + deterministic-repair pass.
 *
 * @param {object}  args
 * @param {string}  args.html       — rendered HTML
 * @param {object}  args.business   — businesses row
 * @param {object?} args.spec       — content_spec used for the render (may be null)
 * @returns {{ html: string, report: object }}
 *   report = { passed, score, counts:{critical,warnings,repaired}, issues:[{severity,code,message,fixed}] }
 */
export function validateAndRefine({ html, business, spec = null }) {
  let out = html || ''
  const issues = []
  const add = (severity, code, message, fixed = false) => issues.push({ severity, code, message, fixed })

  // 1. Unresolved template tokens — must never ship. Strip them. (critical)
  const tokens = out.match(/\{\{[^}]+\}\}/g)
  if (tokens?.length) {
    out = out.replace(/\{\{[^}]+\}\}/g, '')
    add('critical', 'unresolved_tokens',
      `${tokens.length} unresolved template token(s): ${[...new Set(tokens)].slice(0, 5).join(', ')}`, true)
  }

  // 2. Empty list sections — a Services/Menu heading with no items. (critical)
  const emptyLists = out.match(/<ul[^>]*>\s*<\/ul>/gi)
  if (emptyLists?.length) {
    add('critical', 'empty_section', `${emptyLists.length} empty <ul> (offering section rendered with no items)`)
  }

  // 3. Generic placeholder filler leaked → no real offerings were available. (warn)
  const leaked = GENERIC_FILLER.filter((f) => out.includes(`>${f}<`) || out.includes(`${f}</`))
  if (leaked.length) {
    add('warn', 'placeholder_filler', `Generic filler leaked (no real offerings): ${leaked.join(', ')}`)
  }

  // 4. SEO <title> length — measured on decoded text; truncate over-long. (warn / repair)
  const title = decodeEntities((out.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '').trim())
  if (title.length > SEO.titleMax) {
    out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttr(clip(title, SEO.titleMax))}</title>`)
    add('warn', 'seo_title_long', `Title ${title.length} > ${SEO.titleMax} chars — truncated`, true)
  } else if (title && title.length < SEO.titleMin) {
    add('warn', 'seo_title_short', `Title only ${title.length} chars (< ${SEO.titleMin})`)
  }

  // 5. SEO meta description length — measured on decoded text; truncate over-long. (warn / repair)
  const descMatch = out.match(/<meta\s+name="description"\s+content="([\s\S]*?)"\s*\/?>/i)
  const desc = decodeEntities((descMatch?.[1] || '').trim())
  if (descMatch && desc.length > SEO.descMax) {
    out = out.replace(descMatch[0], `<meta name="description" content="${escapeAttr(clip(desc, SEO.descMax))}">`)
    add('warn', 'seo_desc_long', `Meta description ${desc.length} > ${SEO.descMax} chars — truncated`, true)
  } else if (desc && desc.length < SEO.descMin) {
    add('warn', 'seo_desc_short', `Meta description only ${desc.length} chars (< ${SEO.descMin})`)
  }

  // 6. Exactly one <h1> — SEO. (warn)
  const h1Count = (out.match(/<h1[\s>]/gi) || []).length
  if (h1Count !== 1) add('warn', 'h1_count', `Found ${h1Count} <h1> tag(s) (expected exactly 1)`)

  // 7. Empty image sources — drop them so no broken-image icon renders. (warn / repair)
  const emptyImgs = out.match(/<img[^>]*\ssrc=""[^>]*>/gi)
  if (emptyImgs?.length) {
    out = out.replace(/<img[^>]*\ssrc=""[^>]*>/gi, '')
    add('warn', 'empty_img', `${emptyImgs.length} <img> with empty src — removed`, true)
  }

  // 8. Spec-level redundancy — a hero that repeats itself reads as auto-generated. (warn)
  if (spec?.tagline && business?.name && norm(spec.tagline) === norm(business.name)) {
    add('warn', 'tagline_eq_name', 'Tagline duplicates the business name verbatim')
  }
  if (spec?.tagline && spec?.hero_subtext && norm(spec.tagline) === norm(spec.hero_subtext)) {
    add('warn', 'subtext_eq_tagline', 'Hero subtext duplicates the tagline')
  }

  const critical = issues.filter((i) => i.severity === 'critical')
  const warnings = issues.filter((i) => i.severity === 'warn')
  const repaired = issues.filter((i) => i.fixed)

  const report = {
    passed: critical.length === 0,
    score: Math.max(0, 100 - critical.length * 25 - warnings.length * 5),
    counts: { critical: critical.length, warnings: warnings.length, repaired: repaired.length },
    issues,
  }
  return { html: out, report }
}

// Issue codes the LLM tier can meaningfully fix by rewriting spec fields.
// (Structural issues like empty_section are better fixed by re-render alone.)
const LLM_FIXABLE = new Set([
  'placeholder_filler', 'tagline_eq_name', 'subtext_eq_tagline', 'seo_title_short', 'seo_desc_short',
])

/** True when at least one reported issue is worth spending an LLM call to fix. */
export function hasLlmFixableIssues(report) {
  return (report?.issues || []).some((i) => LLM_FIXABLE.has(i.code))
}

/**
 * llmRepairSpec — optional Tier-2 repair (PAID, gated by the worker).
 *
 * Takes the current spec + the QA issue list and asks Haiku to rewrite ONLY the
 * weak fields. Returns a NEW spec object (merged) the caller re-renders from, or
 * null on failure (caller keeps the heuristically-repaired HTML). Modeled on
 * contentAgent.js: Haiku, strict JSON, assistant-prefill, bounded retries.
 *
 * NOTE: requires ANTHROPIC_API_KEY and is off by default (REFINE_LLM_ENABLED).
 * The heuristic stage above is the tested, always-on path; this is the
 * spend-gated escalation for high-value leads only.
 */
export async function llmRepairSpec(business, spec, issues) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const MODEL = process.env.REFINE_LLM_MODEL || 'claude-haiku-4-5'

  const problems = (issues || [])
    .filter((i) => LLM_FIXABLE.has(i.code))
    .map((i) => `- ${i.code}: ${i.message}`)
    .join('\n')

  const system = 'You fix weak website copy. Output valid JSON only — no markdown, no fences, no commentary.'
  const user = `Business: ${business.name || 'Local Business'}
City: ${business.city || 'unknown'}, ${business.country || ''}
Category: ${business.category || spec?._dna_niche || 'local business'}

Current copy (some fields are weak — see problems):
${JSON.stringify({
    tagline: spec?.tagline, hero_subtext: spec?.hero_subtext,
    offerings: spec?.offerings, trust_points: spec?.trust_points,
    meta_title: spec?.meta_title, meta_description: spec?.meta_description,
  }, null, 2)}

Problems to fix:
${problems}

Return JSON with ONLY the fields that need fixing, rewritten to be specific to THIS business (no generic filler, no duplication, SEO meta within length limits):
{
  "tagline": "punchy, <= 10 words, NOT the business name",
  "hero_subtext": "1-2 sentences, must differ from the tagline",
  "offerings": [{"name": "real offering", "desc": "one sentence"}],
  "trust_points": ["specific", "specific", "specific"],
  "meta_title": "<= 60 chars",
  "meta_description": "50-160 chars"
}`

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 700,
        system,
        messages: [
          { role: 'user', content: user },
          { role: 'assistant', content: '{' },
        ],
      })
      const raw = '{' + res.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
      const patch = JSON.parse(raw)
      // Merge: keep everything in the original spec, overlay the rewritten fields.
      const merged = { ...spec }
      for (const k of ['tagline', 'hero_subtext', 'offerings', 'trust_points', 'meta_title', 'meta_description']) {
        if (patch[k] != null && (!Array.isArray(patch[k]) || patch[k].length)) merged[k] = patch[k]
      }
      merged.refined_at = new Date().toISOString()
      logger.info(`[refine][llm] Spec repaired for "${business.name}" (${problems.split('\n').length} issue(s))`)
      return merged
    } catch (err) {
      if (attempt === 2) {
        logger.warn(`[refine][llm] Repair failed for "${business.name}": ${err.message}`)
        return null
      }
      await new Promise((r) => setTimeout(r, attempt * 500))
    }
  }
  return null
}
