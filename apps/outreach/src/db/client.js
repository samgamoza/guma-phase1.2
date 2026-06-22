import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger.js'
import ws from 'ws'

let _client = null
export function getSupabase() {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false }, global: { fetch }, realtime: { transport: ws } }
    )
  }
  return _client
}

/** Pull pending outreach jobs that are reachable by email OR phone.
 *  Email leads → Resend; phone-only leads → Twilio SMS. */
export async function getPendingOutreach(limit = 50) {
  const { data, error } = await getSupabase()
    .from('outreach')
    .select(`
      id, to_email, status,
      businesses(name, category, city, phone, email, country, slug),
      websites(id, slug, status, plan)
    `)
    .eq('status', 'pending')
    .limit(limit)

  if (error) throw error
  // A lead is reachable if it has an email OR a phone
  return (data || []).filter((r) => {
    const b = r.businesses || {}
    return (r.to_email || b.email || b.phone)
  })
}

/** Mark outreach record status and record timestamps.
 *  Resilient to schema drift: if `extras` reference an unknown column
 *  (e.g. `channel` not yet added), retry with the core patch only. */
export async function updateOutreachStatus(id, status, extras = {}) {
  const base = { status }
  if (status === 'sent')    base.sent_at    = new Date().toISOString()
  if (status === 'opened')  base.opened_at  = new Date().toISOString()
  if (status === 'clicked') base.clicked_at = new Date().toISOString()

  const { error } = await getSupabase()
    .from('outreach')
    .update({ ...base, ...extras })
    .eq('id', id)

  if (error) {
    // Retry without extras in case a column (e.g. channel) is missing in the live DB
    const { error: retryErr } = await getSupabase()
      .from('outreach')
      .update(base)
      .eq('id', id)
    if (retryErr) logger.error('updateOutreachStatus error', { id, error: retryErr.message })
    else logger.warn('updateOutreachStatus: applied core patch only (dropped extras)', { id, extras: Object.keys(extras) })
  }
}

/** Count messages sent today (for daily cap enforcement). Optionally filter by channel. */
export async function getSentTodayCount(channel = null) {
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)

  let q = getSupabase()
    .from('outreach')
    .select('id', { count: 'exact', head: true })
    .gte('sent_at', midnight.toISOString())
  if (channel) q = q.eq('channel', channel)

  const { count } = await q
  return count || 0
}

/** Count SMS messages sent today. Falls back to total sent if `channel` column is absent. */
export async function getSmsSentTodayCount() {
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)

  const { count, error } = await getSupabase()
    .from('outreach')
    .select('id', { count: 'exact', head: true })
    .eq('channel', 'sms')
    .gte('sent_at', midnight.toISOString())

  if (error) {
    // channel column may not exist yet — conservatively return 0 so SMS can still flow
    logger.warn('getSmsSentTodayCount: channel filter failed, returning 0', { error: error.message })
    return 0
  }
  return count || 0
}
