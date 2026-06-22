export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { Globe2, Play, CheckCircle2, XCircle, Clock, FileUp, Target } from 'lucide-react'
import { CrawlerFormClient } from './CrawlerFormClient'
import { ImportLeadsClient } from './ImportLeadsClient'
import { TargetsClient } from './TargetsClient'

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function AdminCrawlerPage({ searchParams }: PageProps) {
  const { error, success, tab } = searchParams
  const activeTab = (tab as string) || 'overview'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )

  const [busResult, jobResult, targetsResult, configResult] = await Promise.all([
    supabase.from('businesses').select('id, city, category, created_at, source_dir').order('created_at', { ascending: false }).limit(200),
    supabase.from('crawl_jobs').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('crawl_targets').select('*').order('priority', { ascending: true }).order('city', { ascending: true }),
    supabase.from('scheduler_config').select('*').eq('id', 1).single(),
  ])

  const businesses = busResult.data || []
  const jobs = jobResult.data || []
  const targets = targetsResult.data || []
  const schedulerConfig = configResult.data || { enabled: true, interval_days: 7, batch_size: 3, last_run_at: null }

  const totalCrawled = businesses.length
  const cities = [...new Set(businesses.map((b: any) => b.city).filter(Boolean))]
  const industries = [...new Set(businesses.map((b: any) => b.category).filter(Boolean))]

  const cityBreakdown: Record<string, number> = {}
  businesses.forEach((b: any) => {
    if (b.city) cityBreakdown[b.city] = (cityBreakdown[b.city] || 0) + 1
  })
  const topCities = Object.entries(cityBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const stats = [
    { label: 'Total crawled', value: totalCrawled.toLocaleString(), color: 'text-indigo' },
    { label: 'Cities covered', value: cities.length.toString(), color: 'text-ink' },
    { label: 'Industries', value: industries.length.toString(), color: 'text-ink' },
    { label: 'Active targets', value: targets.filter((t: any) => t.status === 'active').length.toString(), color: 'text-ink' },
  ]

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'targets',  label: `Targets (${targets.length})` },
    { key: 'manual',   label: 'Manual Crawl' },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Globe2 className="w-6 h-6 text-indigo" />
            Crawler
          </h1>
          <p className="text-warm-gray-500 text-sm">Manage crawl targets and monitor business discovery</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          {typeof error === 'string' ? error : 'An unexpected error occurred.'}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-mint/10 border border-mint/20 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Crawl job triggered successfully!
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <div className="text-xs text-warm-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-warm-gray-100">
        {tabs.map(t => (
          <a
            key={t.key}
            href={`?tab=${t.key}`}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === t.key
                ? 'bg-white border border-b-white border-warm-gray-100 -mb-px text-ink'
                : 'text-warm-gray-400 hover:text-ink'
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* City breakdown */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink mb-4">Top Cities Crawled</h2>
            {topCities.length === 0 ? (
              <p className="text-warm-gray-400 text-sm">No data yet</p>
            ) : (
              <div className="space-y-3">
                {topCities.map(([city, count]) => (
                  <div key={city} className="flex items-center gap-3">
                    <span className="text-sm text-ink w-32 truncate">{city}</span>
                    <div className="flex-1 bg-warm-gray-100 rounded-full h-2">
                      <div className="bg-indigo h-2 rounded-full" style={{ width: `${Math.min(100, (count / (topCities[0]?.[1] || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-warm-gray-400 w-10 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scheduler summary */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo" /> Scheduler Summary
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-warm-gray-400">Status</dt>
                <dd><span className={`badge text-[10px] ${schedulerConfig.enabled ? 'bg-mint/15 text-emerald-700' : 'bg-warm-gray-100 text-warm-gray-400'}`}>{schedulerConfig.enabled ? 'Running' : 'Paused'}</span></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-warm-gray-400">Crawl frequency</dt>
                <dd className="text-ink">Every {schedulerConfig.interval_days} days</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-warm-gray-400">Targets per run</dt>
                <dd className="text-ink">{schedulerConfig.batch_size}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-warm-gray-400">Last run</dt>
                <dd className="text-ink">{schedulerConfig.last_run_at ? new Date(schedulerConfig.last_run_at).toLocaleString() : 'Never'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-warm-gray-400">Saturated targets</dt>
                <dd className="text-amber-600">{targets.filter((t: any) => t.status === 'saturated').length}</dd>
              </div>
            </dl>
          </div>

          {/* Recent jobs */}
          <div className="card overflow-hidden md:col-span-2">
            <div className="px-6 py-4 border-b border-warm-gray-100">
              <h2 className="text-sm font-semibold text-ink">Recent Crawl Jobs</h2>
            </div>
            {jobs.length === 0 ? (
              <div className="px-6 py-10 text-center text-warm-gray-400 text-sm">No crawl jobs yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-gray-100 bg-warm-gray-50">
                    {['Region', 'Category', 'Status', 'Found', 'Processed', 'Started'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-warm-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-gray-50">
                  {jobs.map((job: any) => (
                    <tr key={job.id} className="hover:bg-warm-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink">{job.region || '—'}</td>
                      <td className="px-4 py-3 text-warm-gray-500 text-xs">{job.category || 'All'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-[10px] flex items-center gap-1 w-fit ${
                          job.status === 'done'    ? 'bg-mint/15 text-emerald-700' :
                          job.status === 'running' ? 'bg-indigo-muted text-indigo' :
                          job.status === 'failed'  ? 'bg-red-50 text-red-600' :
                                                     'bg-warm-gray-100 text-warm-gray-500'
                        }`}>
                          {job.status === 'done'    && <CheckCircle2 className="w-3 h-3" />}
                          {job.status === 'failed'  && <XCircle className="w-3 h-3" />}
                          {job.status === 'running' && <Clock className="w-3 h-3" />}
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-warm-gray-500">{job.found ?? '—'}</td>
                      <td className="px-4 py-3 text-warm-gray-400 text-xs">{job.processed ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-warm-gray-400">
                        {job.created_at ? new Date(job.created_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab: Targets */}
      {activeTab === 'targets' && (
        <TargetsClient initialTargets={targets as any} schedulerConfig={schedulerConfig as any} />
      )}

      {/* Tab: Manual Crawl */}
      {activeTab === 'manual' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
              <Play className="w-4 h-4 text-indigo" /> Trigger One-Off Crawl
            </h2>
            <CrawlerFormClient />
          </div>
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
              <FileUp className="w-4 h-4 text-indigo" /> Import from Dataset (CSV/JSON)
            </h2>
            <ImportLeadsClient />
          </div>
        </div>
      )}
    </div>
  )
}
