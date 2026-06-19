#!/usr/bin/env node
/**
 * Test script for Guma search/crawl → generation flow
 *
 * Flow:
 * 1. Crawler API: POST /jobs to enqueue a crawl (YellowPages scraping)
 * 2. Crawler Worker: Processes jobs, scrapes businesses, saves to businesses table
 * 3. Generator API: POST /jobs to enqueue generation for businesses without sites
 * 4. Generator Worker: Processes jobs, generates HTML from templates, saves to websites table
 * 5. Outreach: (optional) sends emails
 *
 * Prerequisites:
 * - Redis running on REDIS_URL
 * - Supabase credentials in .env.local or .env files
 * - Node 20+ with ws module
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import { promisify } from 'node:util'

// Load env files manually
const __dirname = dirname(fileURLToPath(import.meta.url))
function loadEnv(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8')
    content.split('\n').forEach(line => {
      line = line.trim()
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=')
        if (key) {
          process.env[key.trim()] = valueParts.join('=').trim()
        }
      }
    })
  } catch (e) {
    // File not found is ok
  }
}

loadEnv(resolve(__dirname, '.env.local'))
loadEnv(resolve(__dirname, '.env'))

// Now load modules
let createClient, ws
try {
  const supabaseModule = await import('@supabase/supabase-js')
  createClient = supabaseModule.createClient
  const wsModule = await import('ws')
  ws = wsModule.default
} catch (e) {
  console.error('❌ Missing dependencies: @supabase/supabase-js or ws')
  console.error('   Run: pnpm install')
  process.exit(1)
}

const sleep = promisify(setTimeout)

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  crawlerApiUrl: process.env.CRAWLER_API_URL || 'http://localhost:3001',
  generatorApiUrl: process.env.GENERATOR_API_URL || 'http://localhost:3002',
  adminSecret: process.env.ADMIN_API_SECRET || '',
  testCity: 'Austin',
  testState: 'TX',
  testCategory: 'Coffee Shops',
  maxPages: 2, // Small for testing
  generationBatchSize: 5,
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function log(stage, msg, data = {}) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${stage}] ${msg}`, data)
}

function error(stage, msg, err) {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] [${stage}] ❌ ${msg}`, err.message || err)
}

async function post(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': config.adminSecret,
        ...headers,
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const json = JSON.parse(data || '{}')
          resolve({ status: res.statusCode, data: json })
        } catch (e) {
          resolve({ status: res.statusCode, data, error: e.message })
        }
      })
    })

    req.on('error', reject)
    req.write(JSON.stringify(body))
    req.end()
  })
}

async function getSupabase() {
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY')
  }
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { persistSession: false },
    global: { fetch },
    realtime: { transport: ws },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

async function testSupabaseConnection() {
  log('SUPABASE', 'Testing connection...')
  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase.from('businesses').select('count', { count: 'exact' }).limit(1)
    if (error) throw error
    log('SUPABASE', '✅ Connected', { url: config.supabaseUrl })
    return true
  } catch (err) {
    error('SUPABASE', 'Connection failed', err)
    return false
  }
}

async function testCrawlerApi() {
  log('CRAWLER_API', 'Testing health endpoint...')
  try {
    const res = await post(`${config.crawlerApiUrl}/health`, {})
    if (res.status !== 200) throw new Error(`Health check failed: ${res.status}`)
    log('CRAWLER_API', '✅ Crawler API is healthy', { url: config.crawlerApiUrl })
    return true
  } catch (err) {
    error('CRAWLER_API', 'API not reachable', err)
    return false
  }
}

async function testGeneratorApi() {
  log('GENERATOR_API', 'Testing health endpoint...')
  try {
    const res = await post(`${config.generatorApiUrl}/health`, {})
    if (res.status !== 200) throw new Error(`Health check failed: ${res.status}`)
    log('GENERATOR_API', '✅ Generator API is healthy', { url: config.generatorApiUrl })
    return true
  } catch (err) {
    error('GENERATOR_API', 'API not reachable', err)
    return false
  }
}

async function triggerCrawl() {
  log('CRAWL', `Triggering crawl for ${config.testCategory} / ${config.testCity}, ${config.testState}...`)
  try {
    const res = await post(`${config.crawlerApiUrl}/jobs`, {
      category: config.testCategory,
      city: config.testCity,
      state: config.testState,
      maxPages: config.maxPages,
      source: 'yellowpages',
    })
    if (res.status !== 200) throw new Error(`API error: ${res.data.error || res.status}`)
    log('CRAWL', '✅ Crawl job enqueued', { jobId: res.data.jobId, dbJobId: res.data.dbJobId })
    return res.data.dbJobId
  } catch (err) {
    error('CRAWL', 'Failed to enqueue crawl', err)
    return null
  }
}

async function waitForBusinesses(city, category, maxWait = 60000, pollInterval = 5000) {
  log('CRAWL_MONITOR', `Waiting for businesses (${city}, ${category}) to appear in DB...`)
  const supabase = await getSupabase()
  const startTime = Date.now()

  while (Date.now() - startTime < maxWait) {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, city, category')
      .eq('city', city)
      .ilike('category', `%${category}%`)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      error('CRAWL_MONITOR', 'Query failed', error)
      await sleep(pollInterval)
      continue
    }

    if (data && data.length > 0) {
      log('CRAWL_MONITOR', `✅ Found ${data.length} businesses`, { businesses: data.map(b => b.name) })
      return data
    }

    log('CRAWL_MONITOR', `No businesses found yet, polling... (${Math.round((Date.now() - startTime) / 1000)}s)`)
    await sleep(pollInterval)
  }

  log('CRAWL_MONITOR', `⏱️ Timeout: no businesses appeared after ${maxWait}ms`)
  return null
}

async function triggerGeneration(limit = config.generationBatchSize) {
  log('GENERATION', `Triggering generation for up to ${limit} businesses without sites...`)
  try {
    const res = await post(`${config.generatorApiUrl}/jobs`, {
      limit,
      priority: 'normal',
    })
    if (res.status !== 200) throw new Error(`API error: ${res.data.error || res.status}`)
    log('GENERATION', `✅ Generation jobs enqueued`, { count: res.data.enqueued, jobIds: res.data.jobIds })
    return res.data.enqueued
  } catch (err) {
    error('GENERATION', 'Failed to enqueue generation', err)
    return 0
  }
}

async function waitForWebsites(businessIds, maxWait = 60000, pollInterval = 5000) {
  if (!businessIds || businessIds.length === 0) {
    log('GENERATION_MONITOR', 'No business IDs to monitor')
    return []
  }

  log('GENERATION_MONITOR', `Waiting for ${businessIds.length} websites to be generated...`)
  const supabase = await getSupabase()
  const startTime = Date.now()

  while (Date.now() - startTime < maxWait) {
    const { data, error } = await supabase
      .from('websites')
      .select('id, business_id, slug, status, generated_at')
      .in('business_id', businessIds)

    if (error) {
      error('GENERATION_MONITOR', 'Query failed', error)
      await sleep(pollInterval)
      continue
    }

    const generated = data?.filter(w => w.status === 'generated') || []
    if (generated.length > 0) {
      log('GENERATION_MONITOR', `✅ Generated ${generated.length}/${businessIds.length} websites`, {
        slugs: generated.map(w => w.slug),
      })
      return generated
    }

    log('GENERATION_MONITOR', `No websites generated yet, polling... (${Math.round((Date.now() - startTime) / 1000)}s)`)
    await sleep(pollInterval)
  }

  log('GENERATION_MONITOR', `⏱️ Timeout: no websites generated after ${maxWait}ms`)
  return []
}

async function verifyFlow() {
  log('VERIFY', 'Checking database schema and recent records...')
  try {
    const supabase = await getSupabase()

    const [busResult, webResult, jobResult] = await Promise.all([
      supabase.from('businesses').select('count', { count: 'exact' }).limit(1),
      supabase.from('websites').select('count', { count: 'exact' }).limit(1),
      supabase.from('crawl_jobs').select('count', { count: 'exact' }).limit(1),
    ])

    log('VERIFY', '✅ Database schema verified', {
      businessesCount: busResult.count || '?',
      websitesCount: webResult.count || '?',
      crawlJobsCount: jobResult.count || '?',
    })

    return true
  } catch (err) {
    error('VERIFY', 'Schema verification failed', err)
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║  Guma: Search/Crawl → Generation Flow Test                     ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')
  console.log()

  // Phase 1: Connectivity checks
  log('PHASE_1', 'Verifying prerequisites...')
  const sbOk = await testSupabaseConnection()
  const crawlerOk = await testCrawlerApi()
  const generatorOk = await testGeneratorApi()
  const schemaOk = await verifyFlow()

  if (!sbOk || !crawlerOk || !generatorOk || !schemaOk) {
    console.error('\n❌ Prerequisites not met. Exiting.')
    process.exit(1)
  }

  console.log()

  // Phase 2: Trigger crawl
  log('PHASE_2', 'Triggering crawl...')
  const crawlJobId = await triggerCrawl()
  if (!crawlJobId) {
    console.error('\n❌ Failed to trigger crawl. Exiting.')
    process.exit(1)
  }

  // Phase 3: Wait for businesses
  log('PHASE_3', 'Waiting for crawl to complete and businesses to appear...')
  const businesses = await waitForBusinesses(config.testCity, config.testCategory, 120000)
  if (!businesses || businesses.length === 0) {
    console.error('\n⚠️ Crawl completed but no businesses found in DB.')
    console.error('   This could mean:')
    console.error('   - Worker not running (start with: pnpm dev:crawler)')
    console.error('   - Network/scraping issue')
    console.error('   - Queue not processed')
    console.error('\n   Continuing to generation test anyway...')
  }

  console.log()

  // Phase 4: Trigger generation
  log('PHASE_4', 'Triggering website generation...')
  const enqueuedCount = await triggerGeneration()
  if (enqueuedCount === 0) {
    console.error('\n⚠️ No businesses queued for generation.')
    console.error('   Possible causes:')
    console.error('   - No businesses in database (see Phase 3)')
    console.error('   - All businesses already have websites')
  }

  // Phase 5: Wait for websites
  log('PHASE_5', 'Waiting for generation to complete...')
  if (businesses && businesses.length > 0) {
    const businessIds = businesses.map(b => b.id)
    const websites = await waitForWebsites(businessIds, 120000)
    if (websites && websites.length > 0) {
      log('PHASE_5', '✅ Flow complete!', {
        businessesCrawled: businesses.length,
        websitesGenerated: websites.length,
        successRate: `${Math.round((websites.length / businesses.length) * 100)}%`,
      })
    }
  }

  console.log()
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║  Test Complete                                                ║')
  console.log('╠════════════════════════════════════════════════════════════════╣')
  console.log('║  Next steps:                                                  ║')
  console.log('║  1. Start services: docker-compose up                         ║')
  console.log('║  2. Run this test: node test-flow.js                          ║')
  console.log('║  3. Check logs: tail -f apps/crawler/logs/* apps/generator/*  ║')
  console.log('║  4. Monitor queue: open http://localhost:3001/bull            ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')
}

main().catch(err => {
  error('MAIN', 'Fatal error', err)
  process.exit(1)
})
