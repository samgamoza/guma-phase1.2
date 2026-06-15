'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, Phone, Globe, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

interface BusinessResult {
  id: string
  name: string
  category: string | null
  city: string | null
  phone: string | null
  address: string | null
  slug: string
  website_status: string | null
}

export default function SignupPage() {
  const [query, setQuery]         = useState('')
  const [city, setCity]           = useState('')
  const [results, setResults]     = useState<BusinessResult[]>([])
  const [searched, setSearched]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/sites/search?q=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setResults(data.businesses || [])
      setSearched(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Find your business</h1>
        <p className="text-warm-gray-500 text-sm mb-8">
          Search for your business name — your site may already be ready to claim.
          Already have an account?{' '}
          <Link href="/auth/login" className="text-indigo hover:underline">Sign in</Link>
        </p>

        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Business name</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Mario's Auto Repair"
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              City <span className="text-warm-gray-400 font-normal">(optional)</span>
            </label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Chicago"
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
            disabled={loading || !query.trim()}
            className="btn-primary w-full justify-center py-3 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <><Search size={15} /> Search</>
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-warm-gray-500 text-sm mb-4">
                We haven't crawled your business yet — but we can add it to the queue.
              </p>
              <Link href="/auth/signup/manual" className="btn-primary text-sm">
                Add my business manually <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs text-warm-gray-400 px-1">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </p>
              {results.map((biz) => (
                <div key={biz.id} className="card p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-ink truncate">{biz.name}</h3>
                        {biz.category && (
                          <span className="badge bg-indigo-muted text-indigo hidden sm:inline-flex">
                            {biz.category}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-warm-gray-400">
                        {biz.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} /> {biz.city}
                          </span>
                        )}
                        {biz.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={11} /> {biz.phone}
                          </span>
                        )}
                        {biz.website_status === 'generated' && (
                          <span className="flex items-center gap-1 text-mint font-medium">
                            <CheckCircle2 size={11} /> Site ready to claim
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/claim/${biz.slug}`}
                      className="btn-primary text-xs px-4 py-2 flex-shrink-0"
                    >
                      Claim free <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
