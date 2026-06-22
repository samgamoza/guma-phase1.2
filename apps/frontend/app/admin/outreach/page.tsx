export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { Send, Mail, MessageSquare } from 'lucide-react'

export default async function AdminOutreachPage({ searchParams }: { searchParams: Record<string, string> }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
  const { data: rows } = await supabase
    .from('outreach')
    .select(`
      id, status, to_email, sent_at, opened_at, clicked_at,
      businesses(name, city, category, email, phone),
      websites(slug)
    `)
    .order('sent_at', { ascending: false, nullsFirst: false })
    .limit(100)

  const records = rows || []

  const stats = {
    pending:  records.filter(r => r.status === 'pending').length,
    sent:     records.filter(r => r.status === 'sent').length,
    opened:   records.filter(r => r.status === 'opened').length,
    clicked:  records.filter(r => r.status === 'clicked').length,
    claimed:  records.filter(r => r.status === 'claimed').length,
  }

  const STATUS_STYLE: Record<string, string> = {
    pending:  'bg-warm-gray-100 text-warm-gray-500',
    sent:     'bg-blue-50 text-blue-700',
    opened:   'bg-amber-50 text-amber-700',
    clicked:  'bg-purple-50 text-purple-700',
    claimed:  'bg-mint/15 text-emerald-700',
    failed:   'bg-red-50 text-red-700',
  }

  // Resolve the outreach channel for a row: email preferred, else SMS
  const channelOf = (r: any): 'email' | 'sms' | null => {
    const email = r.to_email || r.businesses?.email
    if (email) return 'email'
    if (r.businesses?.phone) return 'sms'
    return null
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Outreach</h1>
          <p className="text-warm-gray-500 text-sm">
            Manual mode — sites generate without sending. Review leads below, then send.
          </p>
        </div>
        {stats.pending > 0 && (
          <form action="/api/admin/outreach/send" method="POST">
            <input type="hidden" name="action" value="send_all" />
            <button
              type="submit"
              className="btn-primary text-sm flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send All Pending ({stats.pending})
            </button>
          </form>
        )}
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
      <div className="grid grid-cols-5 gap-4 mb-8">
        {Object.entries(stats).map(([status, count]) => (
          <div key={status} className="card p-5">
            <div className="text-xs text-warm-gray-400 capitalize mb-1">{status}</div>
            <div className="text-2xl font-bold text-ink">{count}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-warm-gray-100 bg-warm-gray-50">
              {['Business', 'Channel', 'Status', 'Sent', 'Opened', 'Site', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-warm-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-gray-50">
            {records.map((r: any) => {
              const channel = channelOf(r)
              const contact = channel === 'email'
                ? (r.to_email || r.businesses?.email)
                : channel === 'sms' ? r.businesses?.phone : '—'
              return (
                <tr key={r.id} className="hover:bg-warm-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink text-xs">{r.businesses?.name || '—'}</div>
                    <div className="text-warm-gray-400 text-[10px]">{r.businesses?.city}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-warm-gray-500 max-w-[180px] truncate">
                    <span className="inline-flex items-center gap-1">
                      {channel === 'email' && <Mail className="w-3 h-3 text-blue-500" />}
                      {channel === 'sms' && <MessageSquare className="w-3 h-3 text-emerald-500" />}
                      {contact || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-[10px] ${STATUS_STYLE[r.status] || 'bg-warm-gray-100 text-warm-gray-500'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-warm-gray-400">
                    {r.sent_at ? new Date(r.sent_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-warm-gray-400">
                    {r.opened_at ? new Date(r.opened_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {r.websites?.slug && (
                      <a
                        href={`/sites/${r.websites.slug}`}
                        target="_blank"
                        className="text-xs text-indigo hover:underline"
                      >
                        View →
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'pending' && channel && (
                      <form action="/api/admin/outreach/send" method="POST" className="inline">
                        <input type="hidden" name="action" value="send_one" />
                        <input type="hidden" name="outreach_id" value={r.id} />
                        <button
                          type="submit"
                          className="btn-ghost text-xs flex items-center gap-1 py-1 px-2"
                          title={`Send via ${channel}`}
                        >
                          <Send className="w-3 h-3" />
                          Send
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
