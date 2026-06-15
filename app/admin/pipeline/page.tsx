export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { ArrowRight, Globe2, Zap, Mail, Key, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react'

export default async function AdminPipelinePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
  const [busResult, siteResult, outreachResult, subResult] = await Promise.all([
    supabase.from('businesses').select('id', { count: 'exact' }).limit(1),
    supabase.from('websites').select('id, status, generated_at', { count: 'exact' }).order('generated_at', { ascending: false }).limit(20),
    supabase.from('outreach').select('id, status, sent_at', { count: 'exact' }).order('sent_at', { ascending: false }).limit(20),
    supabase.from('subscriptions').select('id, plan, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(20),
  ])

  const totalCrawled  = busResult.count || 0
  const totalSites    = siteResult.count || 0
  const totalOutreach = outreachResult.count || 0
  const totalPaid     = subResult.count || 0

  const allSites    = siteResult.data || []
  const allOutreach = outreachResult.data || []
  const allSubs     = subResult.data || []

  const claimedCount  = allSites.filter((s: any) => ['claimed', 'published'].includes(s.status)).length
  const openedCount   = allOutreach.filter((o: any) => ['opened', 'clicked', 'claimed'].includes(o.status)).length

  // Conversion rates
  const crawlToGen  = totalCrawled > 0 ? Math.round((totalSites / totalCrawled) * 100) : 0
  const genToOut    = totalSites > 0 ? Math.round((totalOutreach / totalSites) * 100) : 0
  const outToClaim  = totalOutreach > 0 ? Math.round((claimedCount / totalOutreach) * 100) : 0
  const claimToPaid = claimedCount > 0 ? Math.round((totalPaid / claimedCount) * 100) : 0

  const stages = [
    {
      icon: Globe2,
      label: 'Crawled',
      count: totalCrawled,
      color: 'text-indigo',
      bg: 'bg-indigo-muted',
      border: 'border-indigo/20',
      action: { label: 'New crawl', href: '/admin/crawler' },
      rate: null,
    },
    {
      icon: Zap,
      label: 'Site Built',
      count: totalSites,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      action: { label: 'Generate batch', href: '/admin/generator' },
      rate: crawlToGen,
    },
    {
      icon: Mail,
      label: 'Outreach Sent',
      count: totalOutreach,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      action: { label: 'View outreach', href: '/admin/outreach' },
      rate: genToOut,
    },
    {
      icon: Key,
      label: 'Claimed Free',
      count: claimedCount,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      action: { label: 'View sites', href: '/admin/sites?status=claimed' },
      rate: outToClaim,
    },
    {
      icon: CreditCard,
      label: 'Paid',
      count: totalPaid,
      color: 'text-indigo',
      bg: 'bg-indigo-muted',
      border: 'border-indigo/20',
      action: { label: 'View revenue', href: '/admin' },
      rate: claimToPaid,
    },
  ]

  // Bottleneck: stage with lowest conversion
  const bottleneckIdx = stages
    .map((s, i) => ({ i, rate: s.rate ?? 100 }))
    .filter(x => x.i > 0)
    .sort((a, b) => a.rate - b.rate)[0]?.i ?? -1

  // Live activity feed — merge recent events
  const activity: Array<{ type: string; label: string; ts: string }> = [
    ...allSites.slice(0, 5).map((s: any) => ({
      type: 'site',
      label: `Site ${s.status}`,
      ts: s.created_at,
    })),
    ...allOutreach.slice(0, 5).map((o: any) => ({
      type: 'outreach',
      label: `Outreach ${o.status}`,
      ts: o.sent_at || '',
    })),
    ...allSubs.slice(0, 5).map((sub: any) => ({
      type: 'paid',
      label: `New ${sub.plan} subscription`,
      ts: sub.created_at,
    })),
  ].filter(a => a.ts).sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 15)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo" />
          Pipeline
        </h1>
        <p className="text-warm-gray-500 text-sm">Full business cycle — Crawl → Build → Outreach → Claim → Paid</p>
      </div>

      {/* Funnel */}
      <div className="card p-6 mb-8">
        <div className="flex items-start gap-2">
          {stages.map((stage, idx) => {
            const Icon = stage.icon
            const isBottleneck = idx === bottleneckIdx
            return (
              <div key={stage.label} className="flex items-center gap-2 flex-1">
                <div className={`flex-1 rounded-xl border p-4 ${stage.bg} ${stage.border} ${isBottleneck ? 'ring-2 ring-amber-400' : ''}`}>
                  {isBottleneck && (
                    <div className="flex items-center gap-1 text-amber-600 text-[10px] font-medium mb-2">
                      <AlertTriangle className="w-3 h-3" />
                      Bottleneck
                    </div>
                  )}
                  <div className={`flex items-center gap-2 mb-2 ${stage.color}`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold">{stage.label}</span>
                  </div>
                  <div className={`text-3xl font-bold mb-1 ${stage.color}`}>
                    {stage.count.toLocaleString()}
                  </div>
                  {stage.rate !== null && (
                    <div className="text-[10px] text-warm-gray-400 mb-3">
                      {stage.rate}% from prev stage
                    </div>
                  )}
                  <a href={stage.action.href} className="text-[10px] underline text-warm-gray-500 hover:text-indigo">
                    {stage.action.label} →
                  </a>
                </div>
                {idx < stages.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-warm-gray-300 flex-shrink-0 mt-6" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Conversion Summary */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-ink mb-4">Conversion Rates</h2>
          <div className="space-y-4">
            {[
              { label: 'Crawled → Site Built', rate: crawlToGen, from: totalCrawled, to: totalSites },
              { label: 'Site Built → Outreach', rate: genToOut, from: totalSites, to: totalOutreach },
              { label: 'Outreach → Claimed', rate: outToClaim, from: totalOutreach, to: claimedCount },
              { label: 'Claimed → Paid', rate: claimToPaid, from: claimedCount, to: totalPaid },
            ].map(({ label, rate, from, to }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-warm-gray-500">{label}</span>
                  <span className={`font-medium ${rate < 20 ? 'text-red-500' : rate < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {rate}%
                  </span>
                </div>
                <div className="bg-warm-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${rate < 20 ? 'bg-red-400' : rate < 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, rate)}%` }}
                  />
                </div>
                <div className="text-[10px] text-warm-gray-300 mt-0.5">{from.toLocaleString()} → {to.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-ink mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-warm-gray-400 text-sm">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {activity.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-warm-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      a.type === 'paid' ? 'bg-indigo'
                      : a.type === 'site' ? 'bg-violet-400'
                      : 'bg-amber-400'
                    }`} />
                    <span className="text-ink">{a.label}</span>
                  </div>
                  <span className="text-warm-gray-400">
                    {new Date(a.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
