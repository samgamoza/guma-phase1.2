'use client'

import { useState } from 'react'
import { Play, Clock } from 'lucide-react'

const PREDEFINED_CATEGORIES = [
  'Advertising',
  'Automotive',
  'Beauty & Wellness',
  'Construction & Trades',
  'Education',
  'Food & Restaurants',
  'Health & Medicine',
  'Hospitality',
  'Legal & Financial',
  'Retail',
  'Services',
  'Technology',
  'Other',
]

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'PH', name: 'Philippines' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'IE', name: 'Ireland' },
  { code: 'ZA', name: 'South Africa' },
]

export function CrawlerFormClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [crawlMode, setCrawlMode] = useState<'standard' | 'custom'>('standard')
  const [scopeType, setScopeType] = useState<'limited' | 'unlimited'>('limited')
  const [selectedCategory, setSelectedCategory] = useState('Restaurants')
  const [customCategory, setCustomCategory] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('PH')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setResult(null)

    const formData = new FormData(event.currentTarget)

    // Determine final category
    const categoryField = formData.get('category') as string
    const finalCategory = categoryField === 'Other' ? customCategory : categoryField

    if (!finalCategory) {
      setResult({ ok: false, message: 'Please enter a category' })
      setIsLoading(false)
      return
    }

    const location = (formData.get('location') as string)?.trim()
    if (!location) {
      setResult({ ok: false, message: 'Please enter a location' })
      setIsLoading(false)
      return
    }

    const body: Record<string, any> = {
      action: 'run_one',
    }

    if (crawlMode === 'standard') {
      // Standard mode: use predefined sources
      body.category = finalCategory
      body.city = location
      body.country = selectedCountry
      body.state = (formData.get('state') as string) || ''
      body.source = (formData.get('source') as string) || 'serper'
      body.maxPages = parseInt((formData.get('maxPages') as string) || '2')
    } else {
      // Custom mode: use custom directory URL
      body.customUrl = (formData.get('customUrl') as string)
      body.category = finalCategory
      body.location = location
      body.country = selectedCountry
      body.state = (formData.get('state') as string) || ''
      body.scopeType = scopeType
      if (scopeType === 'limited') {
        body.scopeLimit = parseInt((formData.get('scopeLimit') as string) || '100')
      }
    }

    try {
      const res = await fetch('/api/admin/crawler/run-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      setResult({ ok: true, message: data.message || `Job enqueued: ${data.jobId || ''}` })
    } catch (err: any) {
      setResult({ ok: false, message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode selector */}
      <div>
        <label className="block text-xs font-medium text-white mb-2 uppercase tracking-wide">Crawl Mode</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCrawlMode('standard')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              crawlMode === 'standard'
                ? 'bg-indigo text-white shadow-lg'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Standard Sources
          </button>
          <button
            type="button"
            onClick={() => setCrawlMode('custom')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              crawlMode === 'custom'
                ? 'bg-indigo text-white shadow-lg'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            Custom Directory
          </button>
        </div>
      </div>

      {/* Standard Mode */}
      {crawlMode === 'standard' && (
        <>
          <div>
            <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wide">Source</label>
            <select name="source" className="input w-full text-sm bg-white/8 border-white/20 hover:border-white/40 focus:bg-white/12" defaultValue="serper">
              <option value="serper">Serper.dev (Google Maps) — recommended</option>
              <option value="yellowpages">YellowPages (Playwright)</option>
              <option value="googleplaces">Google Places API</option>
              <option value="apify">Apify (Cloud Actor)</option>
              <option value="brightdata">Bright Data (Dataset API)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wide">Country *</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="input w-full text-sm bg-white/8 border-white/20 hover:border-white/40 focus:bg-white/12"
            >
              {COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wide">City *</label>
              <input name="location" placeholder="e.g. Manila" className="input w-full text-sm bg-white/8 border-white/20 hover:border-white/40 focus:bg-white/12" required />
            </div>
            {selectedCountry === 'US' && (
              <div>
                <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wide">State</label>
                <input name="state" placeholder="e.g. NY" className="input w-full text-sm bg-white/8 border-white/20 hover:border-white/40 focus:bg-white/12" maxLength={2} />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wide">Sub-area queries (depth)</label>
            <select name="maxPages" className="input w-full text-sm bg-white/8 border-white/20 hover:border-white/40 focus:bg-white/12" defaultValue="2">
              <option value="1">1 — fastest, ~10 results</option>
              <option value="2">2 — default, ~20 results</option>
              <option value="5">5 — deeper, ~50 results</option>
              <option value="9">9 — max, ~90 results</option>
            </select>
          </div>
        </>
      )}

      {/* Custom Mode */}
      {crawlMode === 'custom' && (
        <>
          <div>
            <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wide">Directory URL *</label>
            <input
              name="customUrl"
              placeholder="e.g. https://www.businesslist.ph/ or https://www.yelp.com/"
              className="input w-full text-sm bg-white/8 border-white/20 hover:border-white/40 focus:bg-white/12"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wide">Country *</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="input w-full text-sm bg-white/8 border-white/20 hover:border-white/40 focus:bg-white/12"
            >
              {COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wide">City / Region *</label>
              <input
                name="location"
                placeholder="e.g. Manila, Tokyo, London"
                className="input w-full text-sm bg-white/8 border-white/20 hover:border-white/40 focus:bg-white/12"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wide">State / Province</label>
              <input
                name="state"
                placeholder="e.g. California, Ontario"
                className="input w-full text-sm bg-white/8 border-white/20 hover:border-white/40 focus:bg-white/12"
              />
            </div>
          </div>
        </>
      )}

      {/* Category (both modes) */}
      <div>
        <label className="block text-xs font-medium text-white mb-1 uppercase tracking-wide">Category *</label>
        <select
          name="category"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value)
            if (e.target.value !== 'Other') setCustomCategory('')
          }}
          className="input w-full text-sm bg-white/8 border-white/20 hover:border-white/40 focus:bg-white/12"
        >
          {PREDEFINED_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {selectedCategory === 'Other' && (
          <input
            type="text"
            placeholder="Enter custom category"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            className="input w-full text-sm mt-2 bg-white/8 border-white/20 hover:border-white/40 focus:bg-white/12"
          />
        )}
      </div>

      {/* Test Scope (custom mode only) */}
      {crawlMode === 'custom' && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-white uppercase tracking-wide">Test Scope *</label>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="scopeType"
              value="limited"
              checked={scopeType === 'limited'}
              onChange={() => setScopeType('limited')}
              className="cursor-pointer"
            />
            <span className="text-sm text-white/70">Limited to:</span>
            <input
              type="number"
              name="scopeLimit"
              placeholder="100"
              defaultValue="100"
              min="10"
              max="10000"
              className="input w-20 text-sm bg-white/8 border-white/20 hover:border-white/40 focus:bg-white/12"
              disabled={scopeType !== 'limited'}
            />
            <span className="text-xs text-white/50">businesses</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="scopeType"
              value="unlimited"
              checked={scopeType === 'unlimited'}
              onChange={() => setScopeType('unlimited')}
              className="cursor-pointer"
            />
            <span className="text-sm text-white/70">Unlimited (crawl all available)</span>
          </div>
        </div>
      )}

      {result && (
        <div className={`p-3 rounded-lg text-xs ${result.ok ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'}`}>
          {result.message}
        </div>
      )}

      <button type="submit" className="btn-primary w-full text-sm flex items-center justify-center gap-2 mt-6" disabled={isLoading}>
        {isLoading ? <><Clock className="w-4 h-4 animate-spin" /> Triggering...</> : <><Play className="w-4 h-4" /> Start Crawl</>}
      </button>
    </form>
  )
}
