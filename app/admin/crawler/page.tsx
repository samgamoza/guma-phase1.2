export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { Globe2, Play, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default async function AdminCrawlerPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
  const [busResult, jobResult] = await Promise.all([
    supabase
      .from('businesses')
      .select('id, city, category, created_at, source_dir')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('crawl_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const businesses = busResult.data || []
  const jobs = jobResult.data || []

  // Stats from businesses table
  const totalCrawled = businesses.length
  const cities = [...new Set(businesses.map((b: any) => b.city).filter(Boolean))]
  const industries = [...new Set(businesses.map((b: any) => b.category).filter(Boolean))]

  const cityBreakdown: Record<string, number> = {}
  businesses.forEach((b: any) => {
    if (b.city) cityBreakdown[b.city] = (cityBreakdown[b.city] || 0) + 1
  })
  const topCities = Object.entries(cityBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const stats = [
    { label: 'Total crawled', value: totalCrawled.toLocaleString(), color: 'text-indigo' },
    { label: 'Cities covered', value: cities.length.toString(), color: 'text-ink' },
    { label: 'Industries', value: industries.length.toString(), color: 'text-ink' },
    { label: 'Jobs run', value: jobs.length.toString(), color: 'text-ink' },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Globe2 className="w-6 h-6 text-indigo" />
            Crawler
          </h1>
          <p className="text-warm-gray-500 text-sm">Trigger and monitor business crawls</p>
        </div>
      </div>

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
        {/* Trigger Crawl Form */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            <Play className="w-4 h-4 text-indigo" />
            Trigger New Crawl
          </h2>
          <form action="/api/admin/crawler/start" method="POST" className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-warm-gray-500 mb-1">Source</label>
              <select name="source" className="input w-full text-sm">
                <option value="yellowpages">YellowPages (Playwright)</option>
                <option value="googleplaces">Google Places API</option>
                <option value="serper">Serper.dev (Google Maps)</option>
                <option value="apify">Apify (Cloud Actor)</option>
                <option value="brightdata">Bright Data (Dataset API)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-warm-gray-500 mb-1">City</label>
              <input
                name="city"
                placeholder="e.g. Austin"
                className="input w-full text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-warm-gray-500 mb-1">State</label>
              <input
                name="state"
                placeholder="e.g. TX"
                className="input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-warm-gray-500 mb-1">Industry / Category</label>
              <input
                name="industry"
                placeholder="e.g. Restaurant, Plumber, Salon"
                className="input w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-warm-gray-500 mb-1">Max results</label>
              <select name="limit" className="input w-full text-sm">
                <option value="50">50</option>
                <option value="100" selected>100</option>
                <option value="250">250</option>
                <option value="500">500</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full text-sm flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />
              Start Crawl
            </button>
          </form>
        </div>

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
                    <div
                      className="bg-indigo h-2 rounded-full"
                      style={{ width: `${Math.min(100, (count / (topCities[0]?.[1] || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-warm-gray-400 w-10 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-warm-gray-100">
          <h2 className="text-sm font-semibold text-ink">Recent Crawl Jobs</h2>
        </div>
        {jobs.length === 0 ? (
          <div className="px-6 py-12 text-center text-warm-gray-400 text-sm">
            No crawl jobs found. Jobs table may not exist yet — trigger a crawl to create the first record.
          </div>
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
                      job.status === 'done' ? 'bg-mint/15 text-emerald-700'
                      : job.status === 'running' ? 'bg-indigo-muted text-indigo'
                      : job.status === 'failed' ? 'bg-red-50 text-red-600'
                      : 'bg-warm-gray-100 text-warm-gray-500'
                    }`}>
                      {job.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                      {job.status === 'failed' && <XCircle className="w-3 h-3" />}
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
  )
}
