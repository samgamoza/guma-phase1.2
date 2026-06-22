import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import { logger } from '../utils/logger.js'

let _client = null

export function getSupabase() {
  if (!_client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
    _client = createClient(url, key, {
      auth: { persistSession: false },
      global: { fetch },
      realtime: { transport: ws },
    })
  }
  return _client
}

// Columns that exist in the live businesses table (schema drift — see memory)
const BUSINESS_COLS = ['name', 'slug', 'category', 'phone', 'email', 'address', 'city', 'country', 'has_website', 'raw_data', 'source_dir']

/**
 * Upsert a batch of scraped businesses.
 * Uses slug as the conflict key so re-runs are idempotent.
 * Strips any columns not in the live schema to avoid 42703 errors.
 */
export async function upsertBusinesses(businesses) {
  const db = getSupabase()
  const cleaned = businesses.map(b => {
    const out = {}
    for (const col of BUSINESS_COLS) {
      if (b[col] !== undefined) out[col] = b[col]
    }
    return out
  })
  // Deduplicate by slug — Postgres upsert errors if the same slug appears twice in one batch
  const bySlug = new Map(cleaned.map(b => [b.slug, b]))
  const deduped = [...bySlug.values()]

  const { data, error } = await db
    .from('businesses')
    .upsert(deduped, { onConflict: 'slug', ignoreDuplicates: false })
    .select('id, slug')

  if (error) {
    logger.error('DB upsert error', { error: error.message })
    throw error
  }

  return data
}

/**
 * Create or update a crawl_jobs record.
 */
export async function upsertCrawlJob(job) {
  const db = getSupabase()
  const { data, error } = await db
    .from('crawl_jobs')
    .upsert(job, { onConflict: 'id' })
    .select('id')
    .single()

  if (error) {
    logger.error('DB crawl job upsert error', { error: error.message })
    throw error
  }

  return data
}

export async function updateCrawlJob(id, patch) {
  const db = getSupabase()
  const { error } = await db.from('crawl_jobs').update(patch).eq('id', id)
  if (error) logger.error('DB crawl job update error', { error: error.message })
}

/**
 * Check if a business slug already exists — used to skip duplicates
 * when the full batch upsert isn't suitable.
 */
export async function slugExists(slug) {
  const db = getSupabase()
  const { count } = await db
    .from('businesses')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug)
  return (count || 0) > 0
}

// ─── Crawl target management ──────────────────────────────────────────────────

/**
 * Fetch active targets due for crawling (next_crawl_at <= now or null).
 * Ordered by priority (1=highest) then by least-recently crawled.
 */
export async function getActiveCrawlTargets(limit = 5) {
  const db = getSupabase()
  const now = new Date().toISOString()
  const { data, error } = await db
    .from('crawl_targets')
    .select('*')
    .eq('status', 'active')
    .or(`next_crawl_at.is.null,next_crawl_at.lte.${now}`)
    .order('priority', { ascending: true })
    .order('last_crawled_at', { ascending: true, nullsFirst: true })
    .limit(limit)
  if (error) throw error
  return data || []
}

/**
 * After a crawl job completes, update the target's stats.
 * Marks saturated after 3 consecutive runs with 0 new businesses saved.
 */
export async function markTargetCrawled(id, { saved = 0 }) {
  const db = getSupabase()
  const { data: target, error } = await db.from('crawl_targets').select('*').eq('id', id).single()
  if (error || !target) return

  const consecutiveEmpty = saved === 0 ? (target.consecutive_empty_runs + 1) : 0
  const status = consecutiveEmpty >= 3 ? 'saturated' : 'active'
  const cooldownMs = (target.cooldown_days || 30) * 24 * 60 * 60 * 1000
  const nextCrawlAt = new Date(Date.now() + cooldownMs).toISOString()

  await db.from('crawl_targets').update({
    last_crawled_at: new Date().toISOString(),
    next_crawl_at: nextCrawlAt,
    runs_count: (target.runs_count || 0) + 1,
    businesses_found: (target.businesses_found || 0) + saved,
    consecutive_empty_runs: consecutiveEmpty,
    status,
  }).eq('id', id)
}

/**
 * Read scheduler config (single-row settings table).
 */
export async function getSchedulerConfig() {
  const db = getSupabase()
  const { data } = await db.from('scheduler_config').select('*').eq('id', 1).single()
  return data || { enabled: true, interval_days: 7, batch_size: 3 }
}

/**
 * Update scheduler config.
 */
export async function updateSchedulerConfig(patch) {
  const db = getSupabase()
  await db.from('scheduler_config').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1)
}
