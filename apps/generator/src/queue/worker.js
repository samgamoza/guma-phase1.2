import 'dotenv/config'
import { Worker, Queue } from 'bullmq'
import { SiteGenerator } from '../generator/siteGenerator.js'
import { generateFromTemplate } from '../generator/templateEngine.js'
import { resolveCategory } from '../templates/categories.js'
import {
  getBusinessById,
  upsertWebsite,
  enqueueOutreach,
  websiteExistsForBusiness,
} from '../db/client.js'
import { logger } from '../utils/logger.js'

const CONCURRENCY = parseInt(process.env.GENERATE_CONCURRENCY || '5', 10)
const REDIS = { url: process.env.REDIS_URL || 'redis://localhost:6379' }

// USE_AI=true forces Claude API (Phase 5 paid upgrades only).
// Default is false — use free templates for all Phase 1–4 generation.
const USE_AI = process.env.USE_AI === 'true'

// Only instantiate Claude client if AI mode is explicitly enabled
const generator = USE_AI ? new SiteGenerator() : null
if (USE_AI) logger.info('Generator: AI mode ON (Claude API)')
else        logger.info('Generator: Template mode ON (zero cost)')

const worker = new Worker(
  'guma-generate',
  async (job) => {
    const { businessId } = job.data

    // ── 1. Load business from DB ────────────────────────────────────────────
    await job.updateProgress(5)
    const business = await getBusinessById(businessId)

    if (!business) {
      logger.warn(`Business ${businessId} not found — skipping`)
      return { skipped: true }
    }

    // ── Dedup: skip if a site already exists for this business ──────────────
    const alreadyExists = await websiteExistsForBusiness(businessId)
    if (alreadyExists) {
      logger.info(`Site already exists for ${business.name} — skipping duplicate generation`)
      return { skipped: true, reason: 'duplicate' }
    }

    logger.info(`Generating site for: ${business.name} (${business.slug})`)

    // ── 2. Generate HTML — template (free) or Claude AI (paid/USE_AI=true) ──
    await job.updateProgress(10)
    let result
    if (USE_AI && generator) {
      result = await generator.generate(business)
    } else {
      const { key: categoryKey, config: categoryConfig } = resolveCategory(business)
      result = await generateFromTemplate(business, categoryKey, categoryConfig)
    }
    await job.updateProgress(70)

    // ── 3. Save to DB ────────────────────────────────────────────────────────
    const website = await upsertWebsite({
      businessId: result.businessId,
      slug: result.slug,
      html: result.html,
      categoryKey: result.categoryKey,
      theme: result.theme,
      sections: result.sections,
    })
    await job.updateProgress(85)

    // ── 4. Trigger outreach queue ────────────────────────────────────────────
    await enqueueOutreach(businessId, website.id)
    await job.updateProgress(95)

    // ── 5. Optionally trigger Cloudflare Pages deploy hook ───────────────────
    if (process.env.CF_DEPLOY_HOOK_URL) {
      await triggerDeploy(result.slug).catch((err) =>
        logger.warn('Deploy hook failed', { error: err.message })
      )
    }

    await job.updateProgress(100)

    logger.info(`Site generated and saved: ${result.slug}`, {
      category: result.categoryKey,
      htmlBytes: result.html.length,
      tokenEstimate: result.tokenEstimate,
    })

    return {
      slug: result.slug,
      category: result.categoryKey,
      websiteId: website.id,
      htmlBytes: result.html.length,
    }
  },
  {
    connection: REDIS,
    concurrency: CONCURRENCY,
  }
)

// ── Cloudflare Pages deploy hook ──────────────────────────────────────────────

async function triggerDeploy(slug) {
  const res = await fetch(process.env.CF_DEPLOY_HOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  })
  if (!res.ok) throw new Error(`Deploy hook ${res.status}`)
  logger.info(`Deploy triggered for: ${slug}`)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

worker.on('completed', (job, result) => {
  if (!result.skipped) {
    logger.info(`✓ Job ${job.id} done: ${result.slug}`)
  }
})

worker.on('failed', (job, err) => {
  logger.error(`✗ Job ${job?.id} failed`, {
    businessId: job?.data?.businessId,
    error: err.message,
    attempts: job?.attemptsMade,
  })
})

worker.on('error', (err) => logger.error('Worker error', { error: err.message }))

async function shutdown() {
  logger.info('Shutting down generator worker...')
  await worker.close()
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

logger.info(`Generator worker started — concurrency: ${CONCURRENCY}, model: claude-sonnet-4-6`)
