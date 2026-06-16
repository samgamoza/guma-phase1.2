import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger.js'

let _client = null

export function getSupabase() {
  if (!_client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
    _client = createClient(url, key, { auth: { persistSession: false } })
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

/** Check if a site already exists for a business — used to skip redundant generation */
export async function websiteExistsForBusiness(businessId) {
  const { count } = await getSupabase()
    .from('websites')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .in('status', ['generated', 'published'])
  return (count || 0) > 0
}

/** Enqueue outreach after a site is generated */
export async function enqueueOutreach(businessId, websiteId) {
  const { error } = await getSupabase().from('outreach').insert({
    business_id: businessId,
    website_id: websiteId,
    status: 'pending',
  })
  if (error) logger.warn('Failed to enqueue outreach', { error: error.message })
}
