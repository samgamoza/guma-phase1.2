import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Globe, ArrowRight, ExternalLink, Eye,
  Zap, CheckCircle2, TrendingUp, BarChart3
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: websites } = await supabase
    .from('websites')
    .select('*, businesses(name, category, city, phone)')
    .eq('claimed_by', user.id)
    .order('generated_at', { ascending: false })

  const sites      = websites || []
  const hasSites   = sites.length > 0
  const onFreePlan = sites.every((s) => s.plan === 'free')
  const totalViews = sites.reduce((sum, s) => sum + (s.views || 0), 0)

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">Overview</h1>
          <p className="text-warm-gray-400 text-sm mt-0.5">{user?.email}</p>
        </div>
        {hasSites && (
          <Link href="/dashboard/sites" className="btn-secondary text-sm">
            <Globe size={14} /> Manage sites
          </Link>
        )}
      </div>

      {/* Empty state */}
      {!hasSites && (
        <div className="max-w-lg mx-auto mt-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-muted flex items-center justify-center mx-auto mb-5">
            <Globe size={26} className="text-indigo" />
          </div>
          <h2 className="text-xl font-semibold text-ink mb-2">No sites yet</h2>
          <p className="text-warm-gray-400 text-sm mb-8 leading-relaxed">
            Search for your business — your site may already be built and ready to claim for free.
          </p>
          <Link href="/auth/signup" className="btn-primary">
            Find my business <ArrowRight size={15} />
          </Link>
        </div>
      )}

      {hasSites && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-warm-gray-400 uppercase tracking-wide">Sites</span>
                <div className="w-7 h-7 rounded-lg bg-warm-gray-50 flex items-center justify-center">
                  <Globe size={13} className="text-warm-gray-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-ink">{sites.length}</div>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-warm-gray-400 uppercase tracking-wide">Total views</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-muted flex items-center justify-center">
                  <BarChart3 size={13} className="text-indigo" />
                </div>
              </div>
              <div className="text-3xl font-bold text-indigo">{totalViews.toLocaleString()}</div>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-warm-gray-400 uppercase tracking-wide">Plan</span>
                <div className="w-7 h-7 rounded-lg bg-warm-gray-50 flex items-center justify-center">
                  <TrendingUp size={13} className="text-warm-gray-400" />
                </div>
              </div>
              <div className="text-xl font-bold text-ink capitalize">{sites[0]?.plan || 'Free'}</div>
              {onFreePlan && (
                <Link href="/dashboard/upgrade" className="text-xs text-indigo hover:underline mt-0.5 block">
                  Upgrade →
                </Link>
              )}
            </div>
          </div>

          {/* Sites list */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-ink mb-4">Your sites</h2>
            <div className="space-y-3">
              {sites.map((site) => {
                const biz = site.businesses as any
                return (
                  <div key={site.id} className="card p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Globe size={17} className="text-indigo" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-ink">{biz?.name || site.slug}</h3>
                          <span className={`badge text-[10px] ${
                            site.plan === 'free'
                              ? 'bg-warm-gray-100 text-warm-gray-400'
                              : 'bg-indigo-muted text-indigo'
                          }`}>
                            {site.plan}
                          </span>
                          <span className={`badge text-[10px] ${
                            site.status === 'published'
                              ? 'bg-mint/15 text-emerald-700'
                              : 'bg-amber-50 text-amber-600'
                          }`}>
                            {site.status}
                          </span>
                        </div>
                        <div className="text-xs text-warm-gray-400 flex gap-4 flex-wrap">
                          <span>guma.ai/sites/{site.slug}</span>
                          <span className="flex items-center gap-1">
                            <Eye size={10} /> {(site.views || 0).toLocaleString()} views
                          </span>
                          {biz?.city && <span>{biz.city}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <a
                          href={`/sites/${site.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost text-xs py-1.5 px-3"
                        >
                          <ExternalLink size={12} /> View
                        </a>
                        <Link
                          href={`/dashboard/sites/${site.slug}/edit`}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>

                    {site.plan === 'free' && (
                      <div className="mt-4 pt-4 border-t border-warm-gray-100 flex items-center justify-between gap-4">
                        <p className="text-xs text-warm-gray-400">
                          Upgrade to Pro to connect a custom domain and remove the Guma AI badge.
                        </p>
                        <Link
                          href="/dashboard/upgrade"
                          className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
                        >
                          Upgrade $29/mo
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upgrade banner */}
          {onFreePlan && (
            <div className="rounded-2xl bg-ink p-7 flex items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={15} className="text-indigo" />
                  <span className="font-semibold text-white">Unlock Pro features</span>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                  {['Custom domain', 'Drag-and-drop editor', 'Remove badge', 'Contact forms'].map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-xs text-white/60">
                      <CheckCircle2 size={11} className="text-mint flex-shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </div>
              <Link href="/dashboard/upgrade" className="btn-primary flex-shrink-0">
                Upgrade to Pro <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
