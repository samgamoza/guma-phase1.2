/**
 * HTTP API server for the generator service.
 * Allows the frontend admin to trigger and retry generation jobs.
 *
 * POST /jobs        { city?, industry?, limit? }  — batch: enqueue unclaimed businesses
 * POST /jobs/retry  { websiteId }                 — re-queue a single failed website
 * POST /jobs/approve { websiteId }                — approve a site and trigger outreach
 * GET  /health
 */
import 'dotenv/config'
import http from 'node:http'
import { enqueueGenerateJob, generateQueue, outreachQueue } from './queue/queues.js'
import { getSupabase } from './db/client.js'
import { logger } from './utils/logger.js'

const PORT   = process.env.PORT || process.env.GENERATOR_API_PORT || 3002
const SECRET = process.env.ADMIN_API_SECRET   || ''

const supabase = getSupabase()

function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) })
  res.end(payload)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')) } catch { resolve({}) }
    })
    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  if (SECRET && req.headers['x-admin-secret'] !== SECRET) {
    return json(res, 401, { error: 'Unauthorized' })
  }

  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { ok: true, service: 'guma-generator' })
  }

  // Single: enqueue generation for one business by id
  if (req.method === 'POST' && req.url === '/jobs/single') {
    try {
      const { businessId } = await readBody(req)
      if (!businessId) return json(res, 400, { error: 'Missing businessId' })

      const job = await enqueueGenerateJob(businessId)
      logger.info(`API single generation enqueued for business ${businessId} (job ${job.id})`)
      return json(res, 200, { ok: true, jobId: job.id })
    } catch (err) {
      logger.error('API single generate failed', { error: err.message })
      return json(res, 500, { error: err.message })
    }
  }

  // Batch: find businesses without sites and enqueue them
  if (req.method === 'POST' && req.url === '/jobs') {
    try {
      const body = await readBody(req)
      const { city, industry, priority = 'normal', dryRun = false } = body
      // Dev credit control: clamp every batch to GENERATION_BATCH_LIMIT
      const BATCH_CAP = parseInt(process.env.GENERATION_BATCH_LIMIT || '15', 10)
      const limit = Math.min(parseInt(body.limit, 10) || BATCH_CAP, BATCH_CAP)

      // Find reachable businesses that don't have a website yet
      let query = supabase
        .from('businesses')
        .select('id, email, phone')
        .limit(limit * 4)  // over-fetch to account for filtering

      if (city)     query = query.ilike('city', `%${city}%`)
      if (industry) query = query.ilike('category', `%${industry}%`)

      const { data: allBusinesses, error } = await query
      if (error) throw new Error(error.message)

      // Contact gate: generate sites for businesses reachable by email OR phone
      const reachable = (allBusinesses || []).filter(b =>
        (b.email && b.email.trim() !== '') || (b.phone && b.phone.trim() !== '')
      )

      // Filter out businesses that already have websites
      const { data: existingWebsites } = await supabase
        .from('websites')
        .select('business_id')

      const existingIds = new Set(existingWebsites?.map(w => w.business_id) || [])
      const businessesToGenerate = reachable.filter(b => !existingIds.has(b.id))

      const jobs = []
      for (const b of businessesToGenerate.slice(0, limit)) {
        const job = await enqueueGenerateJob(b.id)
        jobs.push(job.id)
      }

      logger.info(`API triggered batch generation: ${jobs.length} jobs`)
      return json(res, 200, { ok: true, enqueued: jobs.length, jobIds: jobs })
    } catch (err) {
      logger.error('API batch generate failed', { error: err.message })
      return json(res, 500, { error: err.message })
    }
  }

  // Force-batch: remove completed/failed jobs and re-queue a specific set of businesses
  if (req.method === 'POST' && req.url === '/jobs/force-batch') {
    try {
      const body = await readBody(req)
      const { businessIds } = body

      if (!Array.isArray(businessIds) || businessIds.length === 0) {
        return json(res, 400, { error: 'Missing businessIds array' })
      }

      const jobs = []
      for (const businessId of businessIds) {
        const jobId = `gen-${businessId}`
        // Remove existing job in any terminal state so BullMQ allows re-queuing
        const existing = await generateQueue.getJob(jobId)
        if (existing) {
          const state = await existing.getState()
          if (state !== 'active') {
            await existing.remove()
          }
        }
        const job = await enqueueGenerateJob(businessId, { force: true })
        jobs.push(job.id)
      }

      logger.info(`API force-batch generation: ${jobs.length} jobs re-queued (force=true)`)
      return json(res, 200, { ok: true, enqueued: jobs.length, jobIds: jobs })
    } catch (err) {
      logger.error('API force-batch failed', { error: err.message })
      return json(res, 500, { error: err.message })
    }
  }

  // Retry a single failed website
  if (req.method === 'POST' && req.url === '/jobs/retry') {
    try {
      const { websiteId } = await readBody(req)
      if (!websiteId) return json(res, 400, { error: 'Missing websiteId' })

      // Get the business ID from the website
      const { data: site } = await supabase
        .from('websites')
        .select('business_id')
        .eq('id', websiteId)
        .single()

      if (!site) return json(res, 404, { error: 'Website not found' })

      // Reset website status so the worker overwrites it
      await supabase
        .from('websites')
        .update({ status: 'pending', error_message: null })
        .eq('id', websiteId)

      const job = await enqueueGenerateJob(site.business_id)
      logger.info(`API retry generation for website ${websiteId}`)
      return json(res, 200, { ok: true, jobId: job.id })
    } catch (err) {
      logger.error('API retry failed', { error: err.message })
      return json(res, 500, { error: err.message })
    }
  }

  // HITL: Approve a pending site and trigger outreach
  if (req.method === 'POST' && req.url === '/jobs/approve') {
    try {
      const { websiteId } = await readBody(req)
      if (!websiteId) return json(res, 400, { error: 'Missing websiteId' })

      // 1. Get the website
      const { data: site, error: fetchError } = await supabase
        .from('websites')
        .select('id, business_id, slug, status')
        .eq('id', websiteId)
        .single()

      if (fetchError || !site) return json(res, 404, { error: 'Website not found' })

      // 2. Fetch or create outreach record
      let outreachId = null
      const { data: outreachRec } = await supabase
        .from('outreach')
        .select('id')
        .eq('website_id', websiteId)
        .eq('status', 'pending')
        .single()

      if (outreachRec) {
        outreachId = outreachRec.id
      } else {
        const { data: newOutreach, error: insertError } = await supabase
          .from('outreach')
          .insert({
            business_id: site.business_id,
            website_id: websiteId,
            status: 'pending',
          })
          .select('id')
          .single()

        if (insertError) throw insertError
        outreachId = newOutreach.id
      }

      // 3. Manually enqueue outreach job with outreachId
      const job = await outreachQueue.add(`outreach:${site.business_id}`, {
        outreachId,
      })

      logger.info(`HITL: Admin approved website ${websiteId} for business ${site.business_id}, enqueued outreach job ${job.id}`)
      return json(res, 200, { ok: true, message: 'Site approved and outreach queued.', jobId: job.id })
    } catch (err) {
      logger.error('API approval failed', { error: err.message })
      return json(res, 500, { error: err.message })
    }
  }

  json(res, 404, { error: 'Not found' })
})

server.listen(PORT, () => {
  logger.info(`Generator API listening on :${PORT}`)
})
