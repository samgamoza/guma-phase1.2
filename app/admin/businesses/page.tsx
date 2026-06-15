export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Globe, CheckCircle2 } from 'lucide-react'

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string }
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
  const page  = parseInt(searchParams.page || '1')
  const q     = searchParams.q || ''
  const PAGE  = 50

  let query = supabase
    .from('businesses')
    .select('id, name, category, city, phone, email, has_website, source_dir, created_at, websites(status)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1)

  if (q) query = query.ilike('name', `%${q}%`)

  const { data, count } = await query
  const businesses = data || []
  const totalPages = Math.ceil((count || 0) / PAGE)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Businesses</h1>
          <p className="text-warm-gray-500 text-sm">{(count || 0).toLocaleString()} total crawled</p>
        </div>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Search name…" className="input w-56 text-sm" />
          <button type="submit" className="btn-primary text-sm px-4">Search</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-warm-gray-100 bg-warm-gray-50">
              {['Business', 'Category', 'City', 'Phone / Email', 'Source', 'Site', 'Crawled'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-warm-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-gray-50">
            {businesses.map((b: any) => {
              const siteStatus = b.websites?.[0]?.status
              return (
                <tr key={b.id} className="hover:bg-warm-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-ink max-w-[200px] truncate">{b.name}</td>
                  <td className="px-4 py-3 text-warm-gray-500 text-xs">{b.category || '—'}</td>
                  <td className="px-4 py-3 text-warm-gray-500 text-xs">{b.city || '—'}</td>
                  <td className="px-4 py-3 text-xs text-warm-gray-500">
                    <div>{b.phone || '—'}</div>
                    {b.email && <div className="text-indigo">{b.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-warm-gray-100 text-warm-gray-500 text-[10px]">
                      {b.source_dir || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {siteStatus ? (
                      <span className={`badge text-[10px] ${
                        siteStatus === 'published' ? 'bg-mint/15 text-emerald-700'
                        : siteStatus === 'generated' ? 'bg-indigo-muted text-indigo'
                        : 'bg-warm-gray-100 text-warm-gray-500'
                      }`}>
                        {siteStatus}
                      </span>
                    ) : (
                      <span className="text-xs text-warm-gray-300">none</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-warm-gray-400">
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 mt-5 justify-center">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
            <Link
              key={p}
              href={`/admin/businesses?page=${p}&q=${q}`}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
                p === page ? 'bg-indigo text-white' : 'bg-white border border-warm-gray-200 text-warm-gray-600 hover:bg-warm-gray-50'
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
