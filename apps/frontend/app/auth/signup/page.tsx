'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getSiteUrl } from '@/lib/site-url'
import { normalizeAuthError } from '@/lib/auth-error'
import {
  Search, MapPin, Phone, Globe, ArrowRight, Loader2, CheckCircle2,
  Mail, ArrowLeft, Sparkles, Building2, ExternalLink, Zap, Star
} from 'lucide-react'

interface BusinessResult {
  id: string
  name: string
  category: string | null
  city: string | null
  phone: string | null
  address: string | null
  slug: string
  website_status: string | null
  source?: string
}

// ─── Sub-screens ─────────────────────────────────────────────────────────────

function ScannerScreen({ status }: { status: string }) {
  return (
    <div className="card p-10 text-center space-y-6 flex flex-col items-center justify-center min-h-[380px]">
      {/* Animated radar rings */}
      <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
        <div className="absolute w-24 h-24 rounded-full border-2 border-indigo/20 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute w-16 h-16 rounded-full border-2 border-indigo/30 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
        <div className="w-12 h-12 rounded-full bg-indigo/10 border-2 border-indigo/40 flex items-center justify-center">
          <Search size={18} className="text-indigo animate-pulse" />
        </div>
      </div>

      <div className="space-y-2 max-w-xs">
        <h2 className="text-xl font-bold text-ink">Scanning the web...</h2>
        <p className="text-xs text-warm-gray-400 animate-pulse leading-relaxed">{status}</p>
      </div>

      {/* Fake progress ticks */}
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

function MagicLinkSentScreen({
  email,
  onBack,
}: {
  email: string
  onBack: () => void
}) {
  return (
    <div className="card p-8 text-center space-y-5 min-h-[350px] flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-muted flex items-center justify-center mx-auto">
        <Mail size={28} className="text-indigo" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-ink mb-1">Check your inbox</h2>
        <p className="text-sm text-warm-gray-500 max-w-xs leading-relaxed font-sans">
          We sent a magic link to <span className="font-semibold text-ink">{email}</span>.
          Click it to verify and proceed.
        </p>
      </div>
      <button onClick={onBack} className="text-xs text-indigo hover:underline font-semibold">
        Use a different email
      </button>
    </div>
  )
}

function ClaimSignupScreen({
  biz,
  onBack,
}: {
  biz: BusinessResult
  onBack: () => void
}) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      if (biz.name) queryParams.set('name', biz.name)
      if (biz.category) queryParams.set('category', biz.category)
      if (biz.city) queryParams.set('city', biz.city)
      if (biz.phone) queryParams.set('phone', biz.phone)
      if (biz.address) queryParams.set('address', biz.address)
      const nextPath = `/auth/signup/manual?${queryParams.toString()}`
      const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`
      const res = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send login link')
      }
      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) return <MagicLinkSentScreen email={email} onBack={() => setSent(false)} />

  return (
    <div className="card p-8 space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-warm-gray-400 hover:text-ink">
        <ArrowLeft size={12} /> Back to results
      </button>

      {/* Business Preview Card */}
      <div className="p-4 bg-indigo-muted/40 rounded-2xl border border-indigo/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo flex items-center justify-center flex-shrink-0">
          <Building2 size={16} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-ink text-sm truncate">{biz.name}</p>
          <p className="text-xs text-warm-gray-400">{biz.category || 'Local Business'}{biz.city ? ` · ${biz.city}` : ''}</p>
        </div>
        {biz.website_status === 'generated' && (
          <span className="ml-auto text-[10px] font-bold text-mint bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">
            Site Ready ✓
          </span>
        )}
      </div>

      <div>
        <span className="text-xs font-bold text-indigo uppercase tracking-wider">Step 2 — Sign Up &amp; Claim</span>
        <h1 className="text-2xl font-bold text-ink mt-1">Claim {biz.name}</h1>
        <p className="text-warm-gray-500 text-sm mt-1">
          Enter your email to verify ownership and activate your website.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Business owner email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="owner@yourbusiness.com"
            required
            className="input"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email}
          className="btn-primary w-full justify-center py-3 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <>Claim My Website Free <ArrowRight size={14} /></>}
        </button>
      </form>

      <p className="text-center text-xs text-warm-gray-400">
        No credit card required. Free forever on the basic plan.
      </p>
    </div>
  )
}

function ManualSignupScreen({ onBack, prefillName }: { onBack: () => void; prefillName?: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)

    try {
      const redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(`/auth/signup/manual${prefillName ? `?name=${encodeURIComponent(prefillName)}` : ''}`)}`
      const res = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send login link')
      }
      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) return <MagicLinkSentScreen email={email} onBack={() => setSent(false)} />

  return (
    <div className="card p-8 space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-warm-gray-400 hover:text-ink">
        <ArrowLeft size={12} /> Back to search
      </button>

      {/* "Not found" context */}
      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
        <Sparkles size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>No existing website found</strong> — but we'll build one for you instantly using your business details.
        </p>
      </div>

      <div>
        <span className="text-xs font-bold text-indigo uppercase tracking-wider">Step 2 — Create Account</span>
        <h1 className="text-2xl font-bold text-ink mt-1">Get your website built</h1>
        <p className="text-warm-gray-500 text-sm mt-1">
          Sign up and we'll walk you through a quick 3-step setup to generate your site instantly.
        </p>
      </div>

      {/* What they'll fill in */}
      <div className="space-y-2">
        {['Business name &amp; category', 'Location &amp; contact details', 'Services / products you offer'].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 text-xs text-warm-gray-500">
            <div className="w-5 h-5 rounded-full bg-indigo text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
              {i + 1}
            </div>
            <span dangerouslySetInnerHTML={{ __html: item }} />
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Your email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="owner@yourbusiness.com"
            required
            className="input"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email}
          className="btn-primary w-full justify-center py-3 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <>Continue to Setup <Sparkles size={14} /></>}
        </button>
      </form>
    </div>
  )
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  results,
  query,
  onSelectBiz,
  onManual,
}: {
  results: BusinessResult[]
  query: string
  onSelectBiz: (biz: BusinessResult) => void
  onManual: () => void
}) {
  if (results.length === 0) {
    return (
      <div className="space-y-3">
        <div className="card p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-warm-gray-100 flex items-center justify-center mx-auto">
            <Globe size={22} className="text-warm-gray-400" />
          </div>
          <div>
            <h2 className="font-bold text-ink text-lg">No existing website found</h2>
            <p className="text-warm-gray-500 text-sm mt-1">
              We couldn't find <strong>"{query}"</strong> online — but we can build one for you in minutes.
            </p>
          </div>
          <button
            onClick={onManual}
            className="btn-primary text-sm inline-flex items-center gap-1.5 mx-auto"
          >
            Build my website now <ArrowRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <p className="text-xs text-warm-gray-400 font-medium">
          {results.length} result{results.length !== 1 ? 's' : ''} found for &ldquo;{query}&rdquo;
        </p>
        <button onClick={onManual} className="text-xs text-indigo hover:underline font-semibold">
          Not mine — build new
        </button>
      </div>

      {results.map(biz => (
        <div
          key={biz.id}
          className="card p-5 hover:shadow-md transition-all hover:border-indigo/20 cursor-pointer group"
          onClick={() => onSelectBiz(biz)}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-muted flex items-center justify-center flex-shrink-0 group-hover:bg-indigo group-hover:text-white transition-colors">
              <Building2 size={16} className="text-indigo group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-ink text-sm">{biz.name}</h3>
                {biz.category && (
                  <span className="badge bg-indigo-muted text-indigo text-[10px]">{biz.category}</span>
                )}
                {biz.website_status === 'generated' && (
                  <span className="badge bg-emerald-50 text-emerald-700 text-[10px] flex items-center gap-1">
                    <CheckCircle2 size={9} /> Site ready
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-warm-gray-400">
                {biz.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={10} /> {biz.city}
                  </span>
                )}
                {biz.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={10} /> {biz.phone}
                  </span>
                )}
                {biz.address && !biz.phone && (
                  <span className="flex items-center gap-1 truncate max-w-[180px]">
                    <MapPin size={10} /> {biz.address}
                  </span>
                )}
              </div>
            </div>
            <button
              className="btn-primary text-xs px-3 py-2 flex-shrink-0 flex items-center gap-1 whitespace-nowrap"
              onClick={e => { e.stopPropagation(); onSelectBiz(biz) }}
            >
              Claim free <ArrowRight size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Signup Content ──────────────────────────────────────────────────────

type Screen = 'search' | 'scanning' | 'results' | 'claim' | 'manual'

function SignupContent() {
  const searchParams = useSearchParams()
  const qParam = searchParams.get('q') || ''
  const cityParam = searchParams.get('city') || ''

  const [screen, setScreen] = useState<Screen>('search')
  const [query, setQuery] = useState(qParam)
  const [city, setCity] = useState(cityParam)
  const [results, setResults] = useState<BusinessResult[]>([])
  const [scanStatus, setScanStatus] = useState('')
  const [selectedBiz, setSelectedBiz] = useState<BusinessResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // If URL already has a query, auto-search on mount
  useEffect(() => {
    if (qParam.trim()) {
      runSearch(qParam, cityParam)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function runSearch(q: string, c: string) {
    setError(null)
    setScreen('scanning')

    const steps = [
      '🔍 Scanning Google business footprints...',
      '🌐 Checking local directory listings...',
      '📍 Matching maps markers and citations...',
      '⚡ Resolving best template match...',
    ]

    let idx = 0
    setScanStatus(steps[0])
    const timer = setInterval(() => {
      idx++
      if (idx < steps.length) setScanStatus(steps[idx])
    }, 700)

    try {
      const start = Date.now()
      const res = await fetch(`/api/sites/search?q=${encodeURIComponent(q)}&city=${encodeURIComponent(c)}`)
      if (!res.ok) throw new Error(`Search error ${res.status}`)
      const data = await res.json()

      const elapsed = Date.now() - start
      await new Promise(r => setTimeout(r, Math.max(0, 2800 - elapsed)))

      setResults(data.businesses || [])
      setScreen('results')
    } catch (err: any) {
      setError('Search failed. Please try again.')
      setScreen('search')
    } finally {
      clearInterval(timer)
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setQuery(query.trim())
    runSearch(query.trim(), city)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (screen === 'scanning') {
    return <ScannerScreen status={scanStatus} />
  }

  if (screen === 'claim' && selectedBiz) {
    return (
      <ClaimSignupScreen
        biz={selectedBiz}
        onBack={() => setScreen('results')}
      />
    )
  }

  if (screen === 'manual') {
    return (
      <ManualSignupScreen
        onBack={() => setScreen(results.length > 0 ? 'results' : 'search')}
        prefillName={query}
      />
    )
  }

  if (screen === 'results') {
    return (
      <div className="space-y-4">
        {/* Compact search hint at top — NOT a full search bar */}
        <div className="flex items-center gap-2 px-1">
          <button
            onClick={() => setScreen('search')}
            className="inline-flex items-center gap-1 text-xs text-warm-gray-400 hover:text-ink"
          >
            <ArrowLeft size={12} /> New search
          </button>
          <div className="flex-1 h-px bg-warm-gray-100" />
          <p className="text-xs text-warm-gray-400 truncate max-w-[180px]">
            Results for &ldquo;<span className="font-semibold text-ink">{query}</span>&rdquo;
          </p>
        </div>

        <ResultsScreen
          results={results}
          query={query}
          onSelectBiz={(biz) => {
            setSelectedBiz(biz)
            setScreen('claim')
          }}
          onManual={() => setScreen('manual')}
        />
      </div>
    )
  }

  // Default: Search screen
  return (
    <div className="space-y-6">
      <div className="card p-8">
        {/* Step indicator */}
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-indigo mb-4">
          <span className="w-4 h-4 rounded-full bg-indigo text-white flex items-center justify-center text-[9px]">1</span>
          Step 1 — Find Your Business
        </div>

        <h1 className="text-2xl font-bold text-ink mb-1">Is your website already waiting?</h1>
        <p className="text-warm-gray-500 text-sm mb-6">
          Search your business name — thousands of local businesses already have a ready-to-claim website.
        </p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Business name</label>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-gray-400 pointer-events-none" />
              <input
                id="signup-search-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. Mario's Auto Repair"
                className="input pl-10"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              City <span className="text-warm-gray-400 font-normal">(optional — improves accuracy)</span>
            </label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-gray-400 pointer-events-none" />
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Manila, Cebu, Davao"
                className="input pl-10"
              />
            </div>
          </div>

          <button
            id="signup-search-btn"
            type="submit"
            disabled={!query.trim()}
            className="btn-primary w-full justify-center py-3 disabled:opacity-50 gap-2"
          >
            <Search size={15} /> Search for My Business
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-warm-gray-100" />
          <span className="text-xs text-warm-gray-400 font-medium">or</span>
          <div className="flex-1 h-px bg-warm-gray-100" />
        </div>

        <button
          onClick={() => setScreen('manual')}
          className="btn-ghost w-full justify-center py-2.5 text-sm gap-2"
        >
          <Sparkles size={14} className="text-indigo" />
          Build my website from scratch
        </button>
      </div>

      {/* Trust proof */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        {['Free to claim', 'No card needed', 'Live in minutes'].map(p => (
          <span key={p} className="flex items-center gap-1.5 text-xs text-warm-gray-400 font-medium">
            <CheckCircle2 size={11} className="text-mint" /> {p}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="card p-8 text-center flex flex-col items-center justify-center min-h-[300px] gap-4">
        <Loader2 className="animate-spin text-indigo" size={24} />
        <p className="text-sm text-warm-gray-400">Loading...</p>
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
