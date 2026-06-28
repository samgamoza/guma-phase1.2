import 'dotenv/config'
import { assertHealthy } from '../utils/healthcheck.js'
import { Worker } from 'bullmq'

await assertHealthy()

import { SiteGenerator }        from '../generator/siteGenerator.js'
import { generateFromTemplate, calculateLeadScore } from '../generator/templateEngine.js'
import { validateAndRefine, llmRepairSpec, hasLlmFixableIssues } from '../generator/refine.js'
import { generateContentSpec }   from '../generator/contentAgent.js'
import { resolveCategory }       from '../templates/categories.js'
import { runBusinessIntelligence } from '../intelligence/businessIntelligence.js'
import { businessDnaToSpec }       from '../intelligence/dnaAdapter.js'
import {
  getBusinessById,
  upsertWebsite,
  enqueueOutreach,
  createPendingOutreach,
  websiteExistsForBusiness,
  getBusinessesWithoutSites,
  saveContentSpec,
  saveBusinessDna,
} from '../db/client.js'
import { enqueueGenerateJob } from './queues.js'
import { logger }             from '../utils/logger.js'

// Business Intelligence stage — mandatory pre-generation step by default.
// Set BUSINESS_INTEL_ENABLED=false to bypass it entirely during testing.
const BUSINESS_INTEL_ENABLED = process.env.BUSINESS_INTEL_ENABLED !== 'false'

const CONCURRENCY = parseInt(process.env.GENERATE_CONCURRENCY || '5', 10)
const REDIS       = { url: process.env.REDIS_URL || 'redis://localhost:6379' }

// Dev credit control:
//   AUTO_GENERATE=false        → background sweep is OFF; generate only via manual admin batches
//   GENERATION_BATCH_LIMIT=15  → never generate more than this many sites per batch
const AUTO_GENERATE     = process.env.AUTO_GENERATE === 'true'
const GEN_BATCH_LIMIT   = parseInt(process.env.GENERATION_BATCH_LIMIT || '15', 10)

const USE_AI  = process.env.USE_AI === 'true'

// Validate & Refine (post-generation QA). The heuristic pass is always on and
// free. The optional Tier-2 LLM repair is OFF by default and only escalates for
// high-value leads, keeping the long tail zero-cost.
//   REFINE_LLM_ENABLED=true     → allow the paid Haiku spec-repair tier
//   REFINE_LLM_MIN_SCORE=80     → only repair leads scoring at/above this
const REFINE_LLM_ENABLED   = process.env.REFINE_LLM_ENABLED === 'true'
const REFINE_LLM_MIN_SCORE = parseInt(process.env.REFINE_LLM_MIN_SCORE || '80', 10)

const generator = USE_AI ? new SiteGenerator() : null
if (USE_AI) logger.info('Generator: AI mode ON (Claude Sonnet)')
else        logger.info('Generator: Template mode ON (Haiku content + pre-built templates)')

const worker = new Worker(
  'guma-generate',
  async (job) => {
    const { businessId, force = false } = job.data

    await job.updateProgress(5)
    const business = await getBusinessById(businessId)

    if (!business) {
      logger.warn(`Business ${businessId} not found — skipping`)
      return { skipped: true }
    }

    // Skip duplicate generation unless force flag is set (force-batch endpoint)
    const alreadyExists = await websiteExistsForBusiness(businessId)
    if (alreadyExists && !force) {
      logger.info(`Site already exists for "${business.name}" — skipping (use force to regenerate)`)
      return { skipped: true, reason: 'duplicate' }
    }

    logger.info(`Generating site for: "${business.name}" (${business.slug})${force ? ' [force]' : ''}`)

    // ── Resolve category ────────────────────────────────────────────────────
    const { key: categoryKey, config: categoryConfig } = resolveCategory(business)
    await job.updateProgress(10)

    // ── Stage: Business Intelligence (pre-generation, mandatory) ─────────────
    // crawl → [business_intelligence] → planning → generation → validation → deployment
    // Produces BusinessDNA (classification, website_strategy, hero_variants,
    // uiux_strategy, content_strategy, seo_strategy), persisted to
    // businesses.business_dna and injected into the Generator. Runs at most
    // once per business (reused on re-render). On total failure it falls back
    // to the existing content flow.
    let dna = business.business_dna || null

    if (BUSINESS_INTEL_ENABLED && !dna && !business.content_spec) {
      const { dna: freshDna, telemetry } = await runBusinessIntelligence(business)
      logger.info('[BI][telemetry]', telemetry)   // duration / success / tokens / cost
      if (freshDna) {
        dna = freshDna
        await saveBusinessDna(business.id, freshDna)
      } else {
        logger.warn(`[BI] no DNA for "${business.name}" — falling back to existing generation flow`)
      }
    }

    await job.updateProgress(30)

    // ── Content spec: BusinessDNA → spec (injection) → DB cache → Haiku fallback ──
    // Priority:
    //   1. cached content_spec (already rendered before)
    //   2. spec derived from BusinessDNA (the strategy drives the Generator)
    //   3. Haiku content agent (fallback when BI failed/disabled)
    let spec = business.content_spec || null

    if (!spec && dna) {
      spec = businessDnaToSpec(dna, business)
      await saveContentSpec(business.id, spec)
      logger.info(`[BI] Generator spec derived from BusinessDNA for "${business.name}" (niche: ${spec._dna_niche || 'n/a'})`)
    }

    if (!spec && !USE_AI) {
      try {
        spec = await generateContentSpec(business, categoryKey, categoryConfig)
        await saveContentSpec(business.id, spec)
        logger.info(`[ContentAgent] Spec saved for "${business.name}" (BI fallback)`)
      } catch (err) {
        logger.warn(`[ContentAgent] Failed for "${business.name}" — falling back to hardcoded content`, {
          error: err.message,
        })
        spec = null
      }
    }

    await job.updateProgress(40)

    // ── Generate HTML ────────────────────────────────────────────────────────
    let result
    if (USE_AI && generator) {
      result = await generator.generate(business)
    } else {
      result = await generateFromTemplate(business, categoryKey, categoryConfig, spec)
    }

    await job.updateProgress(70)

    // ── Stage: Validate & Refine (post-generation QA) ────────────────────────
    // Heuristic checks + safe deterministic repairs on the rendered HTML. The
    // optional LLM tier escalates only for high-value leads with fixable copy.
    let quality = null
    if (result?.html) {
      const refined = validateAndRefine({ html: result.html, business, spec })
      result.html = refined.html
      quality = refined.report

      // Tier 2 — gated LLM repair: rewrite weak spec fields, then re-render once.
      const leadScore = calculateLeadScore(business)
      if (REFINE_LLM_ENABLED && !USE_AI && leadScore >= REFINE_LLM_MIN_SCORE && hasLlmFixableIssues(quality)) {
        logger.info(`[refine] Escalating "${business.name}" to LLM repair (lead ${leadScore}, ${quality.counts.warnings} warn)`)
        const patchedSpec = await llmRepairSpec(business, spec, quality.issues).catch(() => null)
        if (patchedSpec) {
          await saveContentSpec(business.id, patchedSpec).catch(() => {})
          const rerendered = await generateFromTemplate(business, categoryKey, categoryConfig, patchedSpec)
          const reRefined  = validateAndRefine({ html: rerendered.html, business, spec: patchedSpec })
          result.html = reRefined.html
          quality = { ...reRefined.report, llm_repaired: true }
        }
      }

      const lvl = quality.counts.critical ? 'warn' : 'info'
      logger[lvl](`[refine] "${business.name}" — score ${quality.score} ` +
        `(${quality.counts.critical} critical, ${quality.counts.warnings} warn, ${quality.counts.repaired} repaired)`,
        quality.counts.critical ? { issues: quality.issues.filter(i => i.severity === 'critical') } : undefined)
    }

    await job.updateProgress(80)

    // ── Save to DB ───────────────────────────────────────────────────────────
    const website = await upsertWebsite({
      businessId: result.businessId,
      slug:       result.slug,
      html:       result.html,
      categoryKey: result.categoryKey,
      theme:      result.theme,
      sections:   result.sections,
    })

    await job.updateProgress(85)

    // ── Outreach (only on first generation, not on force re-render) ──────────
    // Development phase: do NOT auto-send. Create a pending record that an admin
    // sends manually from the Outreach page. Flip AUTO_OUTREACH=true at launch
    // to send automatically the moment a site is generated.
    if (!alreadyExists) {
      if (process.env.AUTO_OUTREACH === 'true') {
        await enqueueOutreach(businessId, website.id)
      } else {
        await createPendingOutreach(businessId, website.id)
      }
    }

    await job.updateProgress(95)

    if (process.env.CF_DEPLOY_HOOK_URL) {
      await triggerDeploy(result.slug).catch(err =>
        logger.warn('Deploy hook failed', { error: err.message })
      )
    }

    await job.updateProgress(100)

    logger.info(`Site generated: ${result.slug}`, {
      category:   result.categoryKey,
      htmlBytes:  result.html?.length,
      specSource: spec ? (business.content_spec ? 'db-cached' : 'haiku-new') : 'hardcoded',
    })

    return {
      slug:       result.slug,
      category:   result.categoryKey,
      websiteId:  website.id,
      htmlBytes:  result.html?.length,
      specSource: spec ? (business.content_spec ? 'db-cached' : 'haiku-new') : 'hardcoded',
      quality:    quality ? { score: quality.score, ...quality.counts, llm_repaired: !!quality.llm_repaired } : null,
    }
  },
  { connection: REDIS, concurrency: CONCURRENCY }
)

async function triggerDeploy(slug) {
  const res = await fetch(process.env.CF_DEPLOY_HOOK_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ slug }),
  })
  if (!res.ok) throw new Error(`Deploy hook ${res.status}`)
  logger.info(`Deploy triggered for: ${slug}`)
}

worker.on('completed', (job, result) => {
  if (!result?.skipped) logger.info(`✓ Job ${job.id} done: ${result?.slug}`)
})

worker.on('failed', (job, err) => {
  logger.error(`✗ Job ${job?.id} failed`, {
    businessId: job?.data?.businessId,
    error:      err.message,
    attempts:   job?.attemptsMade,
  })
})

worker.on('error', err => logger.error('Worker error', { error: err.message }))

// ── Reconciliation sweep ──────────────────────────────────────────────────────
// Capped at GEN_BATCH_LIMIT per cycle and only active when AUTO_GENERATE=true.
// In dev (AUTO_GENERATE=false) the sweep is disabled so credits are spent only
// on manual admin batches.
const SWEEP_MS = parseInt(process.env.GENERATE_SWEEP_MS || '60000', 10)

async function reconcileMissingSites() {
  try {
    const ids = await getBusinessesWithoutSites(GEN_BATCH_LIMIT)
    if (!ids.length) return
    logger.info(`[sweep] Enqueuing ${ids.length} businesses without sites (cap ${GEN_BATCH_LIMIT})`)
    for (const id of ids) await enqueueGenerateJob(id)
  } catch (err) {
    logger.error('[sweep] Failed', { error: err.message })
  }
}

let sweepTimer = null
if (AUTO_GENERATE) {
  logger.info(`Generator worker started — concurrency: ${CONCURRENCY}, sweep: ${SWEEP_MS}ms, batch cap: ${GEN_BATCH_LIMIT}`)
  reconcileMissingSites()
  sweepTimer = setInterval(reconcileMissingSites, SWEEP_MS)
} else {
  logger.info(`Generator worker started — concurrency: ${CONCURRENCY}, AUTO_GENERATE=off (manual batches only, cap ${GEN_BATCH_LIMIT})`)
}

async function shutdown() {
  logger.info('Shutting down generator worker...')
  if (sweepTimer) clearInterval(sweepTimer)
  await worker.close()
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT',  shutdown)
