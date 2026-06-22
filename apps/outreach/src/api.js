/**
 * HTTP API server for the outreach service.
 * Lets the admin manually trigger outreach (no auto-send during development).
 *
 * POST /send          { outreachId }        — enqueue one pending record
 * POST /send-pending  { limit?, ids? }      — enqueue all (or selected) pending records
 * GET  /health
 *
 * Sends flow through the normal outreach worker, which routes each lead to
 * email (Resend) or SMS (Twilio) based on the contact available.
 */
import 'dotenv/config'
import http from 'node:http'
import { getSupabase, getPendingOutreach } from './db/client.js'
import { enqueueOutreachJob } from './queue/queues.js'
import { logger } from './utils/logger.js'

const PORT   = process.env.PORT || process.env.OUTREACH_API_PORT || 3003
const SECRET = process.env.ADMIN_API_SECRET || ''

function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) })
  res.end(payload)
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')) } catch { resolve({}) } })
    req.on('error', () => resolve({}))
  })
}

const server = http.createServer(async (req, res) => {
  if (SECRET && req.headers['x-admin-secret'] !== SECRET) {
    return json(res, 401, { error: 'Unauthorized' })
  }

  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { ok: true, service: 'guma-outreach-api' })
  }

  // Enqueue a single pending outreach record
  if (req.method === 'POST' && req.url === '/send') {
    try {
      const { outreachId } = await readBody(req)
      if (!outreachId) return json(res, 400, { error: 'Missing outreachId' })

      await enqueueOutreachJob(outreachId)
      logger.info(`Manual send: enqueued outreach ${outreachId}`)
      return json(res, 200, { ok: true, enqueued: 1, outreachId })
    } catch (err) {
      logger.error('Manual /send failed', { error: err.message })
      return json(res, 500, { error: err.message })
    }
  }

  // Enqueue all pending records (optionally a specific subset by ids)
  if (req.method === 'POST' && req.url === '/send-pending') {
    try {
      const { limit = 200, ids = null } = await readBody(req)

      let records = await getPendingOutreach(limit)
      if (Array.isArray(ids) && ids.length > 0) {
        const wanted = new Set(ids)
        records = records.filter((r) => wanted.has(r.id))
      }

      let enqueued = 0
      for (const r of records) {
        await enqueueOutreachJob(r.id)
        enqueued++
      }

      logger.info(`Manual send-pending: enqueued ${enqueued} outreach records`)
      return json(res, 200, { ok: true, enqueued })
    } catch (err) {
      logger.error('Manual /send-pending failed', { error: err.message })
      return json(res, 500, { error: err.message })
    }
  }

  json(res, 404, { error: 'Not found' })
})

// Touch supabase eagerly so a bad config fails loudly at startup
getSupabase()

server.listen(PORT, () => {
  logger.info(`Outreach API listening on :${PORT}`)
})
