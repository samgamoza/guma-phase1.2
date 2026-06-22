import 'dotenv/config'
import { Worker } from 'bullmq'
import { YellowPagesScraper } from '../crawler/yellowpages.js'
import { GooglePlacesScraper } from '../crawler/googleplaces.js'
import { SerperScraper } from '../crawler/serper.js'
import { ApifyScraper } from '../crawler/apify.js'
import { BrightDataScraper } from '../crawler/brightdata.js'
import { ProxyManager } from '../utils/proxy.js'
import { RateLimiter } from '../utils/rateLimiter.js'
import { upsertBusinesses, updateCrawlJob, markTargetCrawled } from '../db/client.js'
import { checkBatchQuality } from '../crawler/siteChecker.js'
import { enqueueGenerateJob } from './queues.js'
import { logger } from '../utils/logger.js'

const CONCURRENCY = parseInt(process.env.CRAWL_CONCURRENCY || '2', 10)

// Dev credit control (shared with generator):
//   AUTO_GENERATE=false → crawling saves leads but does NOT auto-trigger generation
//   GENERATION_BATCH_LIMIT=15 → cap sites generated per crawl when AUTO_GENERATE is on
const AUTO_GENERATE   = process.env.AUTO_GENERATE === 'true'
const GEN_BATCH_LIMIT = parseInt(process.env.GENERATION_BATCH_LIMIT || '15', 10)

const proxyManager = ProxyManager.fromEnv()
const rateLimiter = RateLimiter.fromEnv()

// YellowPages: one shared browser across all worker tasks
const ypScraper = new YellowPagesScraper({ proxyManager, rateLimiter })
await ypScraper.init()

// Google Places: stateless HTTP client, instantiate lazily if key is present
let gpScraper = null
if (process.env.GOOGLE_PLACES_API_KEY) {
  gpScraper = new GooglePlacesScraper()
  logger.info('Google Places scraper ready')
} else {
  logger.warn('GOOGLE_PLACES_API_KEY not set — Google Places source disabled')
}

// Serper: stateless HTTP client, instantiate lazily if key is present
let serperScraper = null
if (process.env.SERPER_API_KEY) {
  serperScraper = new SerperScraper()
  logger.info('Serper scraper ready')
} else {
  logger.warn('SERPER_API_KEY not set — Serper source disabled')
}

// Apify: cloud actor runner, instantiate lazily if token is present
let apifyScraper = null
if (process.env.APIFY_API_TOKEN) {
  apifyScraper = new ApifyScraper()
  logger.info('Apify scraper ready')
} else {
  logger.warn('APIFY_API_TOKEN not set — Apify source disabled')
}

// Bright Data: dataset API or proxy mode, instantiate lazily if token is present
let brightDataScraper = null
if (process.env.BRIGHT_DATA_API_TOKEN) {
  brightDataScraper = new BrightDataScraper()
  logger.info(`Bright Data scraper ready (mode: ${process.env.BRIGHT_DATA_MODE || 'dataset'})`)
} else {
  logger.warn('BRIGHT_DATA_API_TOKEN not set — Bright Data source disabled')
}

const worker = new Worker(
  'guma-crawl',
  async (job) => {
    const { category, city, state, maxPages = 5, jobId, source = 'yellowpages', scheduledTargetId } = job.data
    const label = `[${source}] ${category} / ${city}, ${state}`

    logger.info(`Worker processing: ${label}`)

    if (jobId) {
      await updateCrawlJob(jobId, { status: 'running', started_at: new Date().toISOString() })
    }

    await job.updateProgress(5)

    // ── Select scraper based on source ───────────────────────────────────────
    const scraper =
      source === 'googleplaces' ? gpScraper :
      source === 'serper'       ? serperScraper :
      source === 'apify'        ? apifyScraper :
      source === 'brightdata'   ? brightDataScraper :
      ypScraper

    if (!scraper) {
      const msg = `Scraper for source "${source}" is not available (missing API key?)`
      logger.error(msg)
      if (jobId) await updateCrawlJob(jobId, { status: 'failed', finished_at: new Date().toISOString(), error_log: { message: msg } })
      throw new Error(msg)
    }

    // ── Scrape ──────────────────────────────────────────────────────────────
    let businesses = []
    try {
      businesses = await scraper.scrapeSearch({ category, city, state, maxPages })
    } catch (err) {
      logger.error(`Scrape failed for ${label}`, { error: err.message })
      if (jobId) {
        await updateCrawlJob(jobId, {
          status: 'failed',
          finished_at: new Date().toISOString(),
          error_log: { message: err.message },
        })
      }
      throw err
    }

    await job.updateProgress(60)

    // ── Cold leads: no website at all ────────────────────────────────────────
    const noWebsite = businesses.filter((b) => !b.has_website)
      .map(b => ({ ...b, raw_data: { ...b.raw_data, lead_priority: 'cold', website_quality: 'none' } }))

    // ── Hot leads: has a website but it's outdated/dead ───────────────────────
    const withWebsite = businesses.filter((b) => b.has_website && b.raw_data?.website_url)
    let hotLeads = []
    if (withWebsite.length > 0) {
      hotLeads = await checkBatchQuality(withWebsite, { concurrency: 5 })
      logger.info(`${label}: ${withWebsite.length} sites checked → ${hotLeads.length} hot leads (outdated/dead)`)
    }

    await job.updateProgress(70)

    // ── Combine cold + hot, then apply quality gate ──────────────────────────
    const combined = [...noWebsite, ...hotLeads]

    // ── Quality gate ─────────────────────────────────────────────────────────
    // ALL reachable businesses (email or phone) are saved AND get a site generated.
    // Outreach picks the channel per-lead:
    //   • Has email  → email outreach (Resend)
    //   • Phone-only → SMS outreach (Twilio)
    // Nothing with a real name + contact is ever thrown away.
    const qualified = combined.filter((b) => {
      const hasName    = Boolean(b.name?.trim())
      const hasContact = Boolean(b.phone?.trim() || b.email?.trim())
      if (!hasName || !hasContact) {
        logger.debug(`Skipping "${b.name || 'unnamed'}" — missing name or any contact info`)
        return false
      }
      return true
    })

    const emailLeads = qualified.filter(b => Boolean(b.email?.trim()))
    const phoneLeads = qualified.filter(b => !b.email?.trim() && Boolean(b.phone?.trim()))

    logger.info(
      `${label}: ${businesses.length} scraped → ` +
      `${noWebsite.length} cold + ${hotLeads.length} hot → ` +
      `${emailLeads.length} email + ${phoneLeads.length} phone-only ` +
      `(all generate now) = ${qualified.length} saved`
    )

    await job.updateProgress(75)

    // ── Save to DB ───────────────────────────────────────────────────────────
    let saved = []
    if (qualified.length > 0) {
      try {
        saved = await upsertBusinesses(qualified)
        logger.info(`Saved ${saved.length} businesses to DB`)
      } catch (err) {
        logger.error('DB save failed', { error: err.message })
        throw err
      }
    }

    await job.updateProgress(85)

    // ── Enqueue site generation — ALL reachable leads ─────────────────────────
    // Every saved business (email or phone) gets a site. Outreach later routes
    // to email (Resend) or SMS (Twilio) based on the contact available.
    //
    // Dev credit control: when AUTO_GENERATE is off, crawling still saves all
    // businesses but does NOT auto-trigger generation — sites are generated
    // manually in capped batches from the admin. When on, cap per crawl too.
    const phoneOnlySaved = saved.filter(b => !b.email?.trim() && b.phone?.trim()).length

    let enqueued = 0
    if (AUTO_GENERATE) {
      const toGenerate = saved.slice(0, GEN_BATCH_LIMIT)
      for (const biz of toGenerate) {
        try {
          await enqueueGenerateJob(biz.id)
          enqueued++
        } catch (err) {
          logger.warn(`Failed to enqueue generation for ${biz.id}`, { error: err.message })
        }
      }
    } else {
      logger.info(`${label}: AUTO_GENERATE=off — saved ${saved.length} businesses, generation deferred to manual admin batch`)
    }

    await job.updateProgress(100)

    // ── Update crawl job record ──────────────────────────────────────────────
    if (jobId) {
      await updateCrawlJob(jobId, {
        status: 'done',
        found: businesses.length,
        processed: saved.length,
        finished_at: new Date().toISOString(),
      })
    }

    // ── Update scheduled target stats ────────────────────────────────────────
    if (scheduledTargetId) {
      await markTargetCrawled(scheduledTargetId, { saved: saved.length })
    }

    logger.info(
      `Job done: ${label} — saved ${saved.length} total ` +
      `(${enqueued} → generation queue; ${phoneOnlySaved} of them phone-only → SMS outreach)`
    )

    return { found: businesses.length, saved: saved.length, enqueued, phoneOnlySaved }
  },
  {
    connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
    concurrency: CONCURRENCY,
    limiter: {
      max: parseInt(process.env.REQUESTS_PER_MINUTE || '20', 10),
      duration: 60_000,
    },
  }
)

// ── Worker lifecycle logging ────────────────────────────────────────────────

worker.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed`, result)
})

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed`, { error: err.message, attempts: job?.attemptsMade })
})

worker.on('stalled', (jobId) => {
  logger.warn(`Job ${jobId} stalled`)
})

worker.on('error', (err) => {
  logger.error('Worker error', { error: err.message })
})

// ── Graceful shutdown ───────────────────────────────────────────────────────

async function shutdown() {
  logger.info('Shutting down worker...')
  await worker.close()
  await ypScraper.close()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

logger.info(`Worker started — concurrency: ${CONCURRENCY}`)
