/**
 * send-batch.js
 *
 * Loads pending outreach records from the DB and enqueues them in BullMQ.
 * Run on a cron (e.g. daily at 9am) to trigger the day's email batch.
 *
 * Usage:
 *   node src/send-batch.js              # enqueue up to DAILY_SEND_LIMIT
 *   node src/send-batch.js --limit 50   # override limit
 *   node src/send-batch.js --dry-run    # show what would be sent
 */
import 'dotenv/config'
import { getPendingOutreach, getSentTodayCount } from './db/client.js'
import { enqueueOutreachJob, attachQueueLogging } from './queue/queues.js'
import { logger } from './utils/logger.js'

async function main() {
  const args    = process.argv.slice(2)
  const dryRun  = args.includes('--dry-run')
  const limIdx  = args.indexOf('--limit')
  const dailyCap = parseInt(process.env.DAILY_SEND_LIMIT || '200', 10)
  const overrideLimit = limIdx !== -1 ? parseInt(args[limIdx + 1], 10) : null

  const sentToday = await getSentTodayCount()
  const remaining = dailyCap - sentToday
  const batchSize = overrideLimit ?? Math.min(remaining, parseInt(process.env.BATCH_SIZE || '50', 10))

  logger.info(`Daily cap: ${dailyCap} | Sent today: ${sentToday} | Remaining: ${remaining}`)

  if (remaining <= 0) {
    logger.warn('Daily cap already reached — no emails to send')
    process.exit(0)
  }

  const records = await getPendingOutreach(batchSize)
  logger.info(`Loaded ${records.length} pending outreach records`)

  if (dryRun) {
    logger.info('DRY RUN — would enqueue:')
    records.forEach((r, i) => {
      const biz = r.businesses
      const target = r.to_email || biz?.email
        ? `email:${r.to_email || biz?.email}`
        : biz?.phone ? `sms:${biz.phone}` : 'NO CONTACT'
      logger.info(`  ${i + 1}. ${biz?.name} (${biz?.city}) → ${target}`)
    })
    process.exit(0)
  }

  attachQueueLogging()

  let enqueued = 0
  for (const record of records) {
    const biz = record.businesses
    const reachable = record.to_email || biz?.email || biz?.phone
    if (!reachable) {
      logger.debug(`Skipping ${record.id} — no email or phone`)
      continue
    }
    await enqueueOutreachJob(record.id)
    enqueued++
  }

  logger.info(`Enqueued ${enqueued} outreach jobs. Start worker: node src/queue/worker.js`)
  process.exit(0)
}

main().catch(err => {
  logger.error('Fatal', { error: err.message })
  process.exit(1)
})
