/**
 * Crawl Scheduler
 *
 * Reads active crawl_targets from the DB and enqueues crawl jobs at a
 * configurable interval. Respects the scheduler_config.enabled flag —
 * set it to false in the admin to pause all scheduled crawls without
 * restarting the service.
 *
 * Settings (all live in the scheduler_config DB table):
 *   enabled       — true/false master switch
 *   interval_days — how often to check for due targets (default: 7)
 *   batch_size    — how many targets to enqueue per tick (default: 3)
 */

import 'dotenv/config'
import { getActiveCrawlTargets, getSchedulerConfig, updateSchedulerConfig } from '../db/client.js'
import { enqueueCrawlJob } from '../queue/queues.js'
import { logger } from '../utils/logger.js'

const CHECK_INTERVAL_MS = 60 * 60 * 1000 // check every hour; DB controls actual crawl frequency

async function runTick() {
  let config
  try {
    config = await getSchedulerConfig()
  } catch (err) {
    logger.error('Scheduler: failed to read config', { error: err.message })
    return
  }

  if (!config.enabled) {
    logger.info('Scheduler: disabled via config — skipping tick')
    return
  }

  const batchSize = config.batch_size || 3
  logger.info(`Scheduler: checking for due targets (batch_size=${batchSize})...`)

  let targets
  try {
    targets = await getActiveCrawlTargets(batchSize)
  } catch (err) {
    logger.error('Scheduler: failed to fetch targets', { error: err.message })
    return
  }

  if (targets.length === 0) {
    logger.info('Scheduler: no targets due for crawling')
    await updateSchedulerConfig({ last_run_at: new Date().toISOString() })
    return
  }

  logger.info(`Scheduler: enqueuing ${targets.length} crawl job(s)`)
  for (const target of targets) {
    try {
      await enqueueCrawlJob({
        category: target.category,
        city: target.city,
        state: target.state,
        source: target.source || 'serper',
        maxPages: 5,
        scheduledTargetId: target.id,
      })
      logger.info(`Scheduler: enqueued → ${target.category} / ${target.city}, ${target.state}`)
    } catch (err) {
      logger.error(`Scheduler: failed to enqueue target ${target.id}`, { error: err.message })
    }
  }

  await updateSchedulerConfig({ last_run_at: new Date().toISOString() })
}

// Run immediately on startup, then on interval
logger.info(`Crawler scheduler started — checking every ${CHECK_INTERVAL_MS / 3600000}h`)
await runTick()
setInterval(runTick, CHECK_INTERVAL_MS)

// Keep process alive
process.on('SIGTERM', () => { logger.info('Scheduler shutting down'); process.exit(0) })
process.on('SIGINT',  () => { logger.info('Scheduler shutting down'); process.exit(0) })
