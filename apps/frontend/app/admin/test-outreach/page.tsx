export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { Mail, Zap, AlertTriangle } from 'lucide-react'

export default async function AdminTestOutreachPage({ searchParams }: { searchParams: Record<string, string> }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )

  // Fetch recent test outreach records (ordered by creation)
  const { data: testOutreachRecords } = await supabase
    .from('outreach')
    .select(`
      id, to_email, status, sent_at, opened_at, created_at,
      websites(slug, status, generated_at),
      businesses(name, city)
    `)
    .not('to_email', 'is', null) // Only test records with explicit emails
    .order('created_at', { ascending: false })
    .limit(50)

  const records = testOutreachRecords || []

  const stats = {
    pending:  records.filter(r => r.status === 'pending').length,
    sent:     records.filter(r => r.status === 'sent').length,
    opened:   records.filter(r => r.status === 'opened').length,
    clicked:  records.filter(r => r.status === 'clicked').length,
  }

  const STATUS_STYLE: Record<string, string> = {
    pending:  'bg-warm-gray-100 text-warm-gray-500',
    sent:     'bg-blue-50 text-blue-700',
    opened:   'bg-amber-50 text-amber-700',
    clicked:  'bg-purple-50 text-purple-700',
    failed:   'bg-red-50 text-red-700',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Mail className="w-6 h-6 text-indigo" />
            Test Outreach
          </h1>
          <p className="text-warm-gray-500 text-sm">
            QA mode — upload test emails, generate a batch of sites, queue for sending
          </p>
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

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Upload & Config */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo" />
            Generate & Queue for Test
          </h2>
          <form action="/api/admin/test-outreach/start" method="POST" className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-warm-gray-500 mb-2">
                Test Email Addresses (one per line or comma-separated)
              </label>
              <textarea
                name="emails"
                placeholder="test@example.com&#10;qa@mycompany.com&#10;support@example.com"
                className="input w-full text-sm h-32 font-mono"
                required
              />
              <p className="text-[11px] text-warm-gray-400 mt-1">
                Valid emails only. Max one email per generated site.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-gray-500 mb-2">Batch Size (# of sites to generate)</label>
              <select name="limit" className="input w-full text-sm" defaultValue="5">
                <option value="3">3 sites (minimal QA)</option>
                <option value="5">5 sites (quick test)</option>
                <option value="10">10 sites (thorough QA)</option>
                <option value="15">15 sites (full batch)</option>
              </select>
              <p className="text-[11px] text-warm-gray-400 mt-1">
                Email count should match or exceed batch size.
              </p>
            </div>

            <button type="submit" className="btn-primary w-full text-sm flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              Generate Batch & Queue Emails
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-warm-gray-100">
            <p className="text-xs text-warm-gray-400 mb-3">
              Once queued, test emails appear below. Review, then manually send one-by-one to QA test addresses, or bulk-send from the Outreach page.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-ink mb-4">Test Queue Status</h2>
          <div className="space-y-4">
            {[
              { label: 'Pending', count: stats.pending, color: 'text-warm-gray-500' },
              { label: 'Sent', count: stats.sent, color: 'text-blue-600' },
              { label: 'Opened', count: stats.opened, color: 'text-amber-600' },
              { label: 'Clicked', count: stats.clicked, color: 'text-purple-600' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-sm text-ink">{label}</span>
                <span className={`text-2xl font-bold ${color}`}>{count}</span>
              </div>
            ))}
          </div>

          {records.length === 0 && (
            <div className="mt-6 p-3 bg-warm-gray-50 rounded-lg text-xs text-warm-gray-400">
              No test emails queued yet. Create a batch above to get started.
            </div>
          )}
        </div>
      </div>

      {/* Recent Test Records */}
      {records.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-warm-gray-100">
            <h2 className="text-sm font-semibold text-ink">Recent Test Email Queue ({records.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-gray-100 bg-warm-gray-50">
                {['Email', 'Status', 'Site', 'Sent', 'Opened', 'Queued'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-warm-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-gray-50">
              {records.map((r: any) => (
                <tr key={r.id} className="hover:bg-warm-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-warm-gray-600">{r.to_email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-[10px] ${STATUS_STYLE[r.status] || 'bg-warm-gray-100 text-warm-gray-500'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.websites?.slug && (
                      <a
                        href={`/sites/${r.websites.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo hover:underline truncate max-w-xs"
                      >
                        {r.websites.slug}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-warm-gray-400">
                    {r.sent_at ? new Date(r.sent_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-warm-gray-400">
                    {r.opened_at ? new Date(r.opened_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-warm-gray-400">
                    {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
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
