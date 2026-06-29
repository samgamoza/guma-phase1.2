'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  CheckCircle2, Globe, Loader2, Eye, ArrowRight,
  Phone, MapPin, Clock, Mail
} from 'lucide-react'

type Step = 'loading' | 'preview' | 'verify-email' | 'claiming' | 'done' | 'not-found'

interface SiteData {
  businessName: string
  businessCategory: string
  businessCity: string
  businessPhone: string
  siteSlug: string
  websiteId: string
}

export default function ClaimPage() {
  const { slug } = useParams<{ slug: string }>()
  const router   = useRouter()
  const [step, setStep]       = useState<Step>('loading')
  const [email, setEmail]     = useState('')
  const [site, setSite]       = useState<SiteData | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [magicLink, setMagicLink] = useState('')
  const [isSandbox, setIsSandbox] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/sites/${slug}`)
      if (!res.ok) { setStep('not-found'); return }
      const data = await res.json()
      setSite(data)
      setStep('preview')
    }
    load()
  }, [slug])

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/claim/${slug}/complete`)}`
      const res = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request claim code')
      }
      if (data.link) setMagicLink(data.link)
      if (data.sandboxRestricted) setIsSandbox(true)
      setStep('verify-email')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-warm-gray-400" />
      </div>
    )
  }

  if (step === 'not-found') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="card p-10 max-w-md text-center">
          <h2 className="text-2xl font-bold text-ink mb-2">Site not found</h2>
          <p className="text-warm-gray-600 text-base font-medium mb-6">
            This business hasn't been crawled yet, or the link has expired.
          </p>
          <a href="/" className="btn-primary text-sm">Back to Guma AI</a>
        </div>
      </div>
    )
  }

  if (step === 'verify-email') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="card p-10 max-w-md w-full text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-muted flex items-center justify-center mx-auto">
            <Mail size={24} className="text-indigo" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ink mb-2">Check your inbox</h2>
            <p className="text-warm-gray-600 text-base font-medium">
              We sent a verification link to{' '}
              <span className="font-bold text-ink">{email}</span>.
              Click it to claim your site.
            </p>
            {isSandbox && magicLink && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-left space-y-2 mt-4">
                <p className="text-xs font-bold text-amber-800">⚠️ Resend Sandbox Mode</p>
                <p className="text-xs text-amber-700 leading-normal">
                  Resend is in sandbox mode and only sends to the owner. Since you are in development mode, click below to bypass and claim your site directly:
                </p>
                <a
                  href={magicLink}
                  className="btn-primary py-2 text-xs w-full text-center inline-block font-semibold"
                >
                  Claim & Sign In Instantly (Bypass) →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="card p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-mint/15 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={26} className="text-mint" />
          </div>
          <h2 className="text-2xl font-bold text-ink mb-2">
            {site?.businessName} is yours!
          </h2>
          <p className="text-warm-gray-600 text-base font-medium mb-8">
            Your site is live at{' '}
            <span className="text-indigo font-bold">
              guma.ai/sites/{slug}
            </span>
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary w-full justify-center py-3"
            >
              Go to dashboard <ArrowRight size={16} />
            </button>
            <a
              href={`/sites/${slug}`}
              target="_blank"
              className="btn-secondary w-full justify-center py-3 block text-center"
            >
              <Eye size={15} /> View live site
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Preview + claim form ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream">
      {/* Claim banner */}
      <div className="bg-indigo text-white text-center py-3 px-6 text-sm">
        🎉 We built this site for <strong>{site?.businessName}</strong> — claim it free below
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">

          {/* Left: site preview */}
          <div>
            <div className="section-label mb-3">Your free website</div>
            <h1 className="text-3xl font-bold text-ink mb-2">
              {site?.businessName}
            </h1>
            <div className="flex flex-wrap gap-3 text-base text-warm-gray-600 font-medium mb-8">
              {site?.businessCategory && (
                <span className="badge bg-indigo-muted text-indigo">{site.businessCategory}</span>
              )}
              {site?.businessCity && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {site.businessCity}
                </span>
              )}
              {site?.businessPhone && (
                <span className="flex items-center gap-1">
                  <Phone size={13} /> {site.businessPhone}
                </span>
              )}
            </div>

            {/* Iframe preview */}
            <div className="card overflow-hidden">
              <div className="bg-warm-gray-100 px-4 py-2.5 flex items-center gap-2 border-b border-warm-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-warm-gray-300" />
                  <div className="w-3 h-3 rounded-full bg-warm-gray-300" />
                  <div className="w-3 h-3 rounded-full bg-warm-gray-300" />
                </div>
                <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-warm-gray-400 ml-2">
                  <Globe size={11} className="inline mr-1.5" />
                  Guma AI.io/sites/{slug}
                </div>
                <a
                  href={`/sites/${slug}`}
                  target="_blank"
                  className="text-xs text-indigo hover:underline flex items-center gap-1"
                >
                  <Eye size={12} /> Preview
                </a>
              </div>
              <iframe
                src={`/sites/${slug}`}
                className="w-full h-[520px] border-0"
                title={`Preview of ${site?.businessName}`}
              />
            </div>

            {/* What's included */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { icon: <Globe size={15} />, label: 'Live public URL' },
                { icon: <CheckCircle2 size={15} />, label: 'Mobile responsive' },
                { icon: <Phone size={15} />, label: 'Click-to-call button' },
                { icon: <Clock size={15} />, label: 'Hours & location' },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2.5 text-sm text-warm-gray-600">
                  <div className="text-indigo">{f.icon}</div>
                  {f.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: claim form */}
          <div className="lg:sticky lg:top-8">
            <div className="card p-7">
              <h2 className="text-lg font-semibold text-ink mb-1">Claim your site free</h2>
              <p className="text-warm-gray-500 text-sm mb-6">
                Enter your email to verify you own this business.
                No credit card. No commitment.
              </p>

              <form onSubmit={handleClaim} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Your email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@yourbusiness.com"
                    required
                    className="input"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending || !email}
                  className="btn-primary w-full justify-center py-3 disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>Claim for free <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-warm-gray-100 space-y-2.5">
                <p className="text-[11px] text-warm-gray-400 leading-relaxed">
                  By claiming, you confirm you are the owner or authorised representative
                  of this business.
                </p>
                <div className="flex items-start gap-2 text-xs text-warm-gray-500">
                  <CheckCircle2 size={12} className="text-mint mt-0.5 flex-shrink-0" />
                  Free plan includes hosting, no expiry
                </div>
                <div className="flex items-start gap-2 text-xs text-warm-gray-500">
                  <CheckCircle2 size={12} className="text-mint mt-0.5 flex-shrink-0" />
                  Upgrade to Pro ($29/mo) for custom domain & editor
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
