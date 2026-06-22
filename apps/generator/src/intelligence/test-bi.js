/**
 * Standalone test harness for the Business Intelligence agent.
 *
 * Invokes the agent on a single business and prints the BusinessDNA + telemetry.
 * Use it to iterate on the agent prompt / model without running the full
 * generation pipeline.
 *
 *   node src/intelligence/test-bi.js <businessId>     # a specific business
 *   node src/intelligence/test-bi.js --sample          # first business in DB
 *   node src/intelligence/test-bi.js --save <id>       # also persist business_dna
 */
import 'dotenv/config'
import { getSupabase, saveBusinessDna } from '../db/client.js'
import { runBusinessIntelligence, buildAgentInputs } from './businessIntelligence.js'

async function loadBusiness(arg) {
  const db = getSupabase()
  if (!arg || arg === '--sample') {
    const { data } = await db.from('businesses').select('*').limit(1).order('created_at', { ascending: false })
    return data?.[0]
  }
  const { data } = await db.from('businesses').select('*').eq('id', arg).single()
  return data
}

async function main() {
  const args   = process.argv.slice(2)
  const doSave = args.includes('--save')
  const idArg  = args.find(a => !a.startsWith('--'))

  const business = await loadBusiness(idArg)
  if (!business) {
    console.error('No business found. Pass a business id or --sample.')
    process.exit(1)
  }

  console.log(`\n=== Business ===`)
  console.log(`${business.name}  (${business.city || '—'}, ${business.country || '—'})  id=${business.id}`)
  console.log(`\n=== Agent inputs ===`)
  console.log(JSON.stringify(buildAgentInputs(business), null, 2))

  console.log(`\n=== Invoking Business Intelligence agent... ===`)
  const { dna, telemetry } = await runBusinessIntelligence(business)

  console.log(`\n=== Telemetry ===`)
  console.log(JSON.stringify(telemetry, null, 2))

  if (!dna) {
    console.error('\nAgent failed after retries — no BusinessDNA produced.')
    process.exit(1)
  }

  console.log(`\n=== BusinessDNA ===`)
  console.log(JSON.stringify(dna, null, 2))

  if (doSave && idArg) {
    const ok = await saveBusinessDna(business.id, dna)
    console.log(`\nPersisted to businesses.business_dna: ${ok ? 'OK' : 'FAILED (column missing?)'}`)
  }

  process.exit(0)
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
