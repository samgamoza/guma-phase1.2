import { createClient } from '@supabase/supabase-js'
import { Queue } from 'bullmq'
import ws from 'ws'
import { logger } from '../utils/logger.js'

const outreachQueue = new Queue('guma-outreach', {
  connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 30_000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
  },
})

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

/** Fetch a single business by ID */
export async function getBusinessById(id) {
  const { data, error } = await getSupabase()
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(`Business not found: ${id} — ${error.message}`)
  return data
}

/** Save or update a generated website record */
export async function upsertWebsite({
  businessId,
  slug,
  html,
  categoryKey,
  theme,
  sections,
}) {
  const db = getSupabase()

  const { data, error } = await db
    .from('websites')
    .upsert(
      {
        business_id: businessId,
        slug,
        html_content: html,
        template: categoryKey,
        theme: { colors: theme, sections },
        status: 'generated',
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' }
    )
    .select('id, slug')
    .single()

  if (error) {
    logger.error('Failed to save website', { slug, error: error.message })
    throw error
  }

  logger.info(`Website saved: ${slug} (${data.id})`)
  return data
}

/** Increment the view counter for a published site */
export async function incrementViews(slug) {
  const db = getSupabase()
  await db.rpc('increment_site_views', { site_slug: slug }).catch(() => {
    // Non-critical — don't throw
  })
}

/** Mark a site as published */
export async function publishWebsite(slug) {
  const { error } = await getSupabase()
    .from('websites')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('slug', slug)
  if (error) throw error
}

/** Find businesses that have no website yet — used by the reconciliation sweep */
export async function getBusinessesWithoutSites(limit = 50) {
  const { data, error } = await getSupabase()
    .from('businesses')
    .select('id, websites(id)')
    .order('id', { ascending: false })
    .limit(limit)
  if (error) {
    logger.error('getBusinessesWithoutSites failed', { error: error.message })
    return []
  }
  return (data || [])
    .filter((b) => !b.websites || b.websites.length === 0)
    .map((b) => b.id)
}

/** Check if a site already exists for a business — used to skip redundant generation */
export async function websiteExistsForBusiness(businessId) {
  const { count } = await getSupabase()
    .from('websites')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .in('status', ['generated', 'published'])
  return (count || 0) > 0
}

/** Insert an outreach record and enqueue it for sending */
export async function enqueueOutreach(businessId, websiteId) {
  const { data, error } = await getSupabase()
    .from('outreach')
    .insert({ business_id: businessId, website_id: websiteId, status: 'pending' })
    .select('id')
    .single()

  if (error || !data) {
    logger.warn('Failed to create outreach record', { error: error?.message })
    return
  }

  await outreachQueue.add(
    `outreach:${data.id}`,
    { outreachId: data.id },
    { jobId: `outreach-${data.id}` }
  )
  logger.info(`Outreach queued for website ${websiteId} (record: ${data.id})`)
}
