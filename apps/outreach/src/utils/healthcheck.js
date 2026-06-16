import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'

export async function assertHealthy() {
  const errors = []

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  try {
    const redis = new Redis(redisUrl, { lazyConnect: true, connectTimeout: 5000 })
    await redis.connect()
    await redis.ping()
    redis.disconnect()
  } catch (err) {
    errors.push(`Redis unreachable at ${redisUrl}: ${err.message}`)
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) {
    errors.push('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  } else {
    try {
      const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
      const { error } = await db.from('outreach').select('id', { count: 'exact', head: true })
      if (error) errors.push(`Supabase query failed: ${error.message}`)
    } catch (err) {
      errors.push(`Supabase unreachable: ${err.message}`)
    }
  }

  if (errors.length) {
    console.error('Health check failed:')
    errors.forEach(e => console.error(' •', e))
    process.exit(1)
  }

  console.log('Health check passed (Redis + Supabase reachable)')
}
