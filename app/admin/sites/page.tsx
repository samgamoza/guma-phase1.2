export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Globe, ExternalLink, Mail, Trash2 } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  generated: 'bg-indigo-muted text-indigo',
  claimed:   'bg-amber-50 text-amber-600',
  published: 'bg-mint/15 text-emerald-700',
  failed:    'bg-red-50 text-red-600',
}

export default async function AdminSitesPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; status?: string; industry?: string }
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
  const page     = parseInt(searchParams.page || '1')
  const q        = searchParams.q || ''
  const status   = searchParams.status || ''
  const industry = searchParams.industry || ''
  const PAGE     = 50

  let query = supabase
    .from('websites')
    .select(
      'id, status, slug, generated_at, claimed_at, businesses(name, city, category, email)',
      { count: 'exact' }
    )
    .order('generated_at', { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1)

  if (status) query = query.eq('status', status)

  const { data, count } = await query
  const sites = (data || []).filter((s: any) => {
    if (q && !s.businesses?.name?.toLowerCase().includes(q.toLowerCase())) return false
    if (industry && s.businesses?.category !== industry) return false
    return true
  })

  const totalPages = Math.ceil((count || 0) / PAGE)

  const industries = [...new Set((data || []).map((s: any) => s.businesses?.category).filter(Boolean))]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo" />
            Sites
          </h1>
          <p className="text-warm-gray-500 text-sm">{(count || 0).toLocaleString()} total generated sites</p>
        </div>
      </div>

      {/* Filters */}
      <form className="flex gap-3 mb-6 flex-wrap">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search business name…"
          className="input w-56 text-sm"
        />
        <select name="status" defaultValue={status} className="input text-sm">
          <option value="">All statuses</option>
          <option value="generated">Generated</option>
          <option value="claimed">Claimed</option>
          <option value="published">Published</option>
          <option value="failed">Failed</option>
        </select>
        <select name="industry" defaultValue={industry} className="input text-sm">
          <option value="">All industries</option>
          {industries.map((ind: any) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
        <button type="submit" className="btn-primary text-sm px-4">Filter</button>
        {(q || status || industry) && (
          <Link href="/admin/sites" className="btn-ghost text-sm px-4">Clear</Link>
        )}
      </form>

      {/* Sites Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-warm-gray-100 bg-warm-gray-50">
              {['Business', 'City', 'Industry', 'Site URL', 'Status', 'Claimed', 'Generated', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-warm-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-gray-50">
            {sites.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-warm-gray-400 text-sm">
                  No sites found matching your filters.
                </td>
              </tr>
            ) : sites.map((site: any) => (
              <tr key={site.id} className="hover:bg-warm-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-ink max-w-[160px] truncate">
                  {site.businesses?.name || '—'}
                </td>
                <td className="px-4 py-3 text-warm-gray-500 text-xs">{site.businesses?.city || '—'}</td>
                <td className="px-4 py-3">
                  {site.businesses?.category && (
                    <span className="badge bg-warm-gray-100 text-warm-gray-500 text-[10px]">
                      {site.businesses.category}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs font-mono text-warm-gray-500">
                  {site.slug ? `/sites/${site.slug}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge text-[10px] ${STATUS_COLORS[site.status] || 'bg-warm-gray-100 text-warm-gray-400'}`}>
                    {site.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-warm-gray-400">
                  {site.claimed_at ? new Date(site.claimed_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-warm-gray-400">
                  {site.generated_at ? new Date(site.generated_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {site.slug && (
                      <a
                        href={`/sites/${site.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost text-xs p-1.5"
                        title="View site"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {site.businesses?.email && (
                      <form action="/api/admin/outreach/resend" method="POST" className="inline">
                        <input type="hidden" name="website_id" value={site.id} />
                        <button type="submit" className="btn-ghost text-xs p-1.5" title="Resend outreach">
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    )}
                    <form action="/api/admin/sites/delete" method="POST" className="inline">
                      <input type="hidden" name="website_id" value={site.id} />
                      <button
                        type="submit"
                        className="btn-ghost text-xs p-1.5 text-red-400 hover:text-red-600"
                        title="Delete site"
                        onClick={(e) => { if (!confirm('Delete this site?')) e.preventDefault() }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 mt-5 justify-center">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
            <Link
              key={p}
              href={`/admin/sites?page=${p}&q=${q}&status=${status}&industry=${industry}`}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
                p === page
                  ? 'bg-indigo text-white'
                  : 'bg-white border border-warm-gray-200 text-warm-gray-600 hover:bg-warm-gray-50'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
