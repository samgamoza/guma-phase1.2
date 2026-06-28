import 'dotenv/config'
import { getSupabase } from './src/db/client.js'
const db = getSupabase()
const { count } = await db.from('websites').select('id',{count:'exact',head:true}).eq('status','generated')
const { data } = await db.from('websites').select('slug, template').eq('status','generated').limit(5000)
const tally = {}
for (const w of data||[]) tally[w.template] = (tally[w.template]||0)+1
console.log(`Total generated sites: ${count}`)
console.log('Template distribution:', Object.entries(tally).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}:${v}`).join('  '))
for (const slug of ['sabado-auto-electrical-repair-shop-co-national-road-br','sideburns-barber-shop-quezon-city-metro-manila']) {
  const w = (data||[]).find(x=>x.slug===slug)
  console.log(`  ${slug} → template=${w?.template}`)
}
// confirm the auto shop no longer renders a retail products store
const { data: auto } = await db.from('websites').select('html_content').eq('slug','sabado-auto-electrical-repair-shop-co-national-road-br').single()
const h = auto?.html_content||''
console.log(`  auto-shop html: has "Shop Now"=${h.includes('Shop Now')}  has "Premium Item"=${h.includes('Premium Item')}  has trades CTA=${/Free Quote|Get a Quote|Call Now/i.test(h)}`)
process.exit(0)
