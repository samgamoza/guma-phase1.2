export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { Zap, Play, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, RotateCcw } from 'lucide-react'

export default async function AdminGeneratorPage({ searchParams }: { searchParams: Record<string, string> }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
  const [websiteResult, businessResult, genJobResult] = await Promise.all([
    supabase
      .from('websites')
      .select('id, status, generated_at, business_id')
      .order('generated_at', { ascending: false })
      .limit(200),
    supabase
      .from('businesses')
      .select('id')
      .eq('site_generated', false)
      .limit(1000),
    supabase
      .from('generation_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const websites = websiteResult.data || []
  const genJobs = genJobResult.data || []

  const statusCounts = {
    generated: websites.filter((w: any) => w.status === 'generated').length,
    claimed: websites.filter((w: any) => w.status === 'claimed').length,
    published: websites.filter((w: any) => w.status === 'published').length,
    failed: websites.filter((w: any) => w.status === 'failed').length,
  }

  const successRate = websites.length > 0
    ? Math.round(((websites.length - statusCounts.failed) / websites.length) * 100)
    : 0

  const avgGenTime = websites
    .filter((w: any) => w.generation_time_ms)
    .reduce((sum: number, w: any) => sum + w.generation_time_ms, 0) / (websites.filter((w: any) => w.generation_time_ms).length || 1)

  const failedSites = websites.filter((w: any) => w.status === 'failed').slice(0, 20)

  const stats = [
    { label: 'Total generated', value: websites.length.toLocaleString(), color: 'text-indigo' },
    { label: 'Success rate', value: `${successRate}%`, color: successRate > 90 ? 'text-emerald-600' : 'text-amber-600' },
    { label: 'Avg gen time', value: avgGenTime > 0 ? `${(avgGenTime / 1000).toFixed(1)}s` : '—', color: 'text-ink' },
    { label: 'Failed', value: statusCounts.failed.toString(), color: statusCounts.failed > 0 ? 'text-red-500' : 'text-ink' },
  ]

  return (
    <div className="p-8" suppressHydrationWarning>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Zap className="w-6 h-6 text-indigo" />
            Generator
          </h1>
          <p className="text-warm-gray-500 text-sm">Trigger and monitor website generation</p>
        </div>
      </div>

      {/* Flash messages */}
      {searchParams.success && (
        <div className="mb-6 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          ✓ {searchParams.success}
        </div>
      )}
      {searchParams.error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          ✗ {searchParams.error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <div className="text-xs text-warm-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Trigger Generation */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            <Play className="w-4 h-4 text-indigo" />
            Trigger Batch Generation
          </h2>
          <form action="/api/admin/generator/start" method="POST" className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-warm-gray-500 mb-1">Filter by City (optional)</label>
              <input name="city" placeholder="Leave blank for all" className="input w-full text-sm" suppressHydrationWarning />
            </div>
            <div>
              <label className="block text-xs font-medium text-warm-gray-500 mb-1">Filter by Industry (optional)</label>
              <input name="industry" placeholder="Leave blank for all" className="input w-full text-sm" suppressHydrationWarning />
            </div>
            <div>
              <label className="block text-xs font-medium text-warm-gray-500 mb-1">Batch size</label>
              <select name="limit" className="input w-full text-sm">
                <option value="15">15 sites (dev cap)</option>
                <option value="10">10 sites</option>
                <option value="5">5 sites</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-warm-gray-500 mb-1">Priority</label>
              <select name="priority" className="input w-full text-sm">
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="low">Low</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full text-sm flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              Generate Batch
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-warm-gray-100">
            <p className="text-xs text-warm-gray-400 mb-3">
              Force regenerate clears all existing generated sites and re-runs generation for every business.
              Claimed &amp; published sites are protected.
            </p>
            <form action="/api/admin/generator/force" method="POST">
              <button
                type="submit"
                className="w-full text-sm flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Force Regenerate All
              </button>
            </form>
          </div>
        </div>

        {/* Queue Status */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-ink mb-4">Queue Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Generated (done)', count: statusCounts.generated, color: 'bg-indigo' },
              { label: 'Claimed', count: statusCounts.claimed, color: 'bg-mint' },
              { label: 'Published', count: statusCounts.published, color: 'bg-emerald-500' },
              { label: 'Failed', count: statusCounts.failed, color: 'bg-red-400' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm text-ink w-36 truncate">{label}</span>
                <div className="flex-1 bg-warm-gray-100 rounded-full h-2">
                  <div
                    className={`${color} h-2 rounded-full`}
                    style={{ width: `${websites.length > 0 ? Math.min(100, (count / websites.length) * 100) : 0}%` }}
                  />
                </div>
                <span className="text-xs text-warm-gray-400 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>

          {genJobs.length === 0 && (
            <div className="mt-4 p-3 bg-warm-gray-50 rounded-lg text-xs text-warm-gray-400">
              No active generation jobs in queue.
            </div>
          )}
        </div>
      </div>

      {/* Failed Sites */}
      {failedSites.length > 0 && (
        <div className="card overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-warm-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Failed Generations ({statusCounts.failed})
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-gray-100 bg-warm-gray-50">
                {['Business ID', 'Error', 'Failed at', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-warm-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-gray-50">
              {failedSites.map((site: any) => (
                <tr key={site.id} className="hover:bg-warm-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-warm-gray-500">{site.business_id?.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-xs text-red-500 max-w-xs truncate">
                    {site.error_message || 'Unknown error'}
                  </td>
                  <td className="px-4 py-3 text-xs text-warm-gray-400">
                    {site.created_at ? new Date(site.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <form action="/api/admin/generator/retry" method="POST" className="inline">
                      <input type="hidden" name="website_id" value={site.id} />
                      <button type="submit" className="btn-ghost text-xs flex items-center gap-1 py-1 px-2">
                        <RefreshCw className="w-3 h-3" />
                        Retry
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Job History */}
      {genJobs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-warm-gray-100">
            <h2 className="text-sm font-semibold text-ink">Generation Jobs</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-gray-100 bg-warm-gray-50">
                {['Batch', 'Status', 'Completed', 'Failed', 'Started'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-warm-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-gray-50">
              {genJobs.map((job: any) => (
                <tr key={job.id} className="hover:bg-warm-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-warm-gray-500">{job.id?.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-[10px] ${
                      job.status === 'completed' ? 'bg-mint/15 text-emerald-700'
                      : job.status === 'running' ? 'bg-indigo-muted text-indigo'
                      : job.status === 'failed' ? 'bg-red-50 text-red-600'
                      : 'bg-warm-gray-100 text-warm-gray-500'
                    }`}>{job.status}</span>
                  </td>
                  <td className="px-4 py-3 text-warm-gray-500">{job.completed_count ?? '—'}</td>
                  <td className="px-4 py-3 text-red-400">{job.failed_count ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-warm-gray-400">
                    {job.created_at ? new Date(job.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
