export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

async function getMetrics() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
  const [businesses, sites, outreach, subscriptions] = await Promise.all([
    supabase.from('businesses').select('id', { count: 'exact', head: true }),
    supabase.from('websites').select('id, plan, status', { count: 'exact' }),
    supabase.from('outreach').select('id, status'),
    supabase.from('subscriptions').select('id, plan, status').eq('status', 'active'),
  ])

  const sitesData     = sites.data || []
  const outreachData  = outreach.data || []
  const subsData      = subscriptions.data || []

  return {
    totalBusinesses: businesses.count || 0,
    totalSites:      sitesData.length,
    generatedSites:  sitesData.filter(s => s.status === 'generated').length,
    claimedSites:    sitesData.filter(s => ['claimed','published'].includes(s.status)).length,
    outreachSent:    outreachData.filter(o => o.status !== 'pending').length,
    outreachOpened:  outreachData.filter(o => ['opened','clicked','claimed'].includes(o.status)).length,
    outreachClaimed: outreachData.filter(o => o.status === 'claimed').length,
    paidSubs:        subsData.length,
    proSubs:         subsData.filter(s => s.plan === 'pro').length,
    bizSubs:         subsData.filter(s => s.plan === 'business').length,
    mrr:             subsData.reduce((s, sub) => s + (sub.plan === 'pro' ? 29 : sub.plan === 'business' ? 79 : 0), 0),
  }
}

export default async function AdminPage() {
  const m = await getMetrics()
  const openRate   = m.outreachSent > 0 ? ((m.outreachOpened  / m.outreachSent) * 100).toFixed(1) : '—'
  const claimRate  = m.outreachSent > 0 ? ((m.outreachClaimed / m.outreachSent) * 100).toFixed(1) : '—'
  const upgradeRate = m.claimedSites > 0 ? ((m.paidSubs / m.claimedSites) * 100).toFixed(1) : '—'

  const metrics = [
    { label: 'Businesses crawled',  value: m.totalBusinesses.toLocaleString(), color: 'text-indigo' },
    { label: 'Sites generated',     value: m.totalSites.toLocaleString(),       color: 'text-ink' },
    { label: 'Sites claimed',        value: m.claimedSites.toLocaleString(),    color: 'text-mint' },
    { label: 'Outreach sent',        value: m.outreachSent.toLocaleString(),    color: 'text-ink' },
    { label: 'Open rate',            value: `${openRate}%`,                     color: 'text-ink' },
    { label: 'Claim rate',           value: `${claimRate}%`,                    color: 'text-ink' },
    { label: 'Paid subscribers',     value: m.paidSubs.toString(),              color: 'text-amber-600' },
    { label: 'MRR',                  value: `$${m.mrr.toLocaleString()}`,       color: 'text-emerald-600' },
  ]

  const funnel = [
    { stage: 'Crawled',  n: m.totalBusinesses, pct: 100 },
    { stage: 'Site built', n: m.totalSites,    pct: m.totalBusinesses > 0 ? (m.totalSites / m.totalBusinesses) * 100 : 0 },
    { stage: 'Outreach sent', n: m.outreachSent, pct: m.totalSites > 0 ? (m.outreachSent / m.totalSites) * 100 : 0 },
    { stage: 'Claimed (free)', n: m.claimedSites, pct: m.outreachSent > 0 ? (m.claimedSites / m.outreachSent) * 100 : 0 },
    { stage: 'Paid',     n: m.paidSubs,         pct: m.claimedSites > 0 ? (m.paidSubs / m.claimedSites) * 100 : 0 },
  ]

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Admin overview</h1>
        <p className="text-warm-gray-500 text-sm">Platform-wide metrics</p>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {metrics.map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <div className="text-xs text-warm-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-semibold text-ink mb-5">Conversion funnel</h2>
        <div className="space-y-3">
          {funnel.map(({ stage, n, pct }) => (
            <div key={stage}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-ink">{stage}</span>
                <span className="text-warm-gray-500">
                  {n.toLocaleString()} <span className="text-warm-gray-300">({pct.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="h-2 bg-warm-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo rounded-full transition-all"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue summary */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-ink mb-4">Revenue</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-warm-gray-50 rounded-xl p-4">
            <div className="text-xs text-warm-gray-400 mb-1">MRR</div>
            <div className="text-2xl font-bold text-emerald-600">${m.mrr.toLocaleString()}</div>
          </div>
          <div className="bg-warm-gray-50 rounded-xl p-4">
            <div className="text-xs text-warm-gray-400 mb-1">Pro ($29)</div>
            <div className="text-2xl font-bold text-ink">{m.proSubs}</div>
          </div>
          <div className="bg-warm-gray-50 rounded-xl p-4">
            <div className="text-xs text-warm-gray-400 mb-1">Business ($79)</div>
            <div className="text-2xl font-bold text-ink">{m.bizSubs}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
