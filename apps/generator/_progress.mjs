import 'dotenv/config'
import { getSupabase } from './src/db/client.js'
const since = new Date(Date.now() - 6*60*1000).toISOString()
const { count, error } = await getSupabase()
  .from('websites').select('id', { count: 'exact', head: true })
  .gte('generated_at', since)
if (error) console.log('query err:', error.message)
else console.log(`Sites regenerated in last 6 min: ${count}`)
process.exit(0)
