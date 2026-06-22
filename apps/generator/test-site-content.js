import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
)

// Get all businesses to confirm count
const { data: businesses, count } = await supabase
  .from('businesses')
  .select('id, name', { count: 'exact' })
  .limit(5)

console.log('Total businesses in DB:', count)
console.log('First 5 businesses:')
for (const b of businesses ?? []) {
  console.log(`  id=${b.id} name="${b.name}"`)
}

// Check websites count
const { count: siteCount } = await supabase
  .from('websites')
  .select('id', { count: 'exact', head: true })

console.log('\nTotal websites in DB:', siteCount)

// Check completed BullMQ jobs by calling the force-batch endpoint test
console.log('\nTesting force-batch endpoint...')
const res = await fetch('http://localhost:3002/jobs/force-batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ businessIds: [businesses?.[0]?.id].filter(Boolean) }),
})
console.log('Status:', res.status)
const result = await res.json()
console.log('Result:', JSON.stringify(result))
